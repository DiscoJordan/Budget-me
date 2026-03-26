import React, { useContext, useEffect } from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import axios from "axios";
import { AccountsContext, AccountsProvider } from "../context/AccountsContext";
import { UsersContext } from "../context/UsersContext";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Minimal UsersContext wrapper that provides a fake user
function MockUsersProvider({ children }: { children: React.ReactNode }) {
  return (
    <UsersContext.Provider
      value={{
        user: { id: "u1", username: "test", email: "t@t.com", currency: "USD" },
        login: jest.fn(),
        register: jest.fn(),
        setUser: jest.fn(),
      } as any}
    >
      {children}
    </UsersContext.Provider>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MockUsersProvider>
      <AccountsProvider>{children}</AccountsProvider>
    </MockUsersProvider>
  );
}

describe("AccountsContext — activeAccount sync on getAccountsOfUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update activeAccount when accounts are refreshed with new data", async () => {
    const originalAccount = {
      _id: "acc1",
      name: "John",
      type: "debt",
      currency: "USD",
      balance: 100,
      icon: { color: "#FF0000", icon_value: "credit-card-outline" },
      subcategories: [],
      initialBalance: 0,
      ownerId: "u1",
    };

    const updatedAccount = {
      ...originalAccount,
      currency: "EUR",
      balance: 200,
    };

    // First call returns original, second returns updated
    mockedAxios.get
      .mockResolvedValueOnce({ data: { data: [originalAccount] } })
      .mockResolvedValueOnce({ data: { data: [updatedAccount] } });

    let capturedActiveAccount: any = null;
    let capturedSetActiveAccount: any = null;
    let capturedGetAccountsOfUser: any = null;

    function TestConsumer() {
      const { activeAccount, setActiveAccount, getAccountsOfUser, accounts } =
        useContext(AccountsContext);
      capturedActiveAccount = activeAccount;
      capturedSetActiveAccount = setActiveAccount;
      capturedGetAccountsOfUser = getAccountsOfUser;

      return (
        <Text testID="currency">
          {activeAccount?.currency ?? "none"}
        </Text>
      );
    }

    const { getByTestId } = render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    // Load initial accounts
    await act(async () => {
      await capturedGetAccountsOfUser();
    });

    // Set active account to the original
    await act(async () => {
      capturedSetActiveAccount(originalAccount);
    });

    expect(getByTestId("currency").props.children).toBe("USD");

    // Simulate: user edits currency in NewAccount, saves, getAccountsOfUser is called
    await act(async () => {
      await capturedGetAccountsOfUser();
    });

    // activeAccount should now reflect the updated currency
    await waitFor(() => {
      expect(capturedActiveAccount?.currency).toBe("EUR");
    });
  });

  it("should clear activeAccount if the account was deleted", async () => {
    const account = {
      _id: "acc1",
      name: "John",
      type: "debt",
      currency: "USD",
      balance: 0,
      icon: { color: "#FF0000", icon_value: "credit-card-outline" },
      subcategories: [],
      initialBalance: 0,
      ownerId: "u1",
    };

    mockedAxios.get
      .mockResolvedValueOnce({ data: { data: [account] } })
      .mockResolvedValueOnce({ data: { data: [] } }); // account deleted

    let capturedActiveAccount: any = null;
    let capturedSetActiveAccount: any = null;
    let capturedGetAccountsOfUser: any = null;

    function TestConsumer() {
      const { activeAccount, setActiveAccount, getAccountsOfUser } =
        useContext(AccountsContext);
      capturedActiveAccount = activeAccount;
      capturedSetActiveAccount = setActiveAccount;
      capturedGetAccountsOfUser = getAccountsOfUser;
      return <Text testID="name">{activeAccount?.name ?? "none"}</Text>;
    }

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await capturedGetAccountsOfUser();
    });

    await act(async () => {
      capturedSetActiveAccount(account);
    });

    expect(capturedActiveAccount?.name).toBe("John");

    // Refresh — account is gone
    await act(async () => {
      await capturedGetAccountsOfUser();
    });

    await waitFor(() => {
      expect(capturedActiveAccount).toBeNull();
    });
  });
});
