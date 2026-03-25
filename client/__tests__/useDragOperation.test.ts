import { renderHook, act } from "@testing-library/react-native";
import { useDragOperation, isValidDrop } from "../hooks/useDragOperation";
import { Account } from "../src/types";

const makeAccount = (id: string, type: Account["type"]): Account => ({
  _id: id,
  ownerId: "user1",
  name: id,
  type,
  balance: 0,
  initialBalance: 0,
  currency: "USD",
  subcategories: [],
  icon: { color: "#fff", icon_value: "wallet" },
});

const income = makeAccount("i1", "income");
const personal = makeAccount("p1", "personal");
const expense = makeAccount("e1", "expense");

const TARGET_LAYOUT = { pageX: 100, pageY: 100, width: 60, height: 60 };
// point inside target
const INSIDE = { x: 130, y: 130 };
// point outside any target
const OUTSIDE = { x: 0, y: 0 };

describe("isValidDrop", () => {
  it("income → personal is valid", () => {
    expect(isValidDrop(income, personal)).toBe(true);
  });
  it("personal → expense is valid", () => {
    expect(isValidDrop(personal, expense)).toBe(true);
  });
  it("income → expense is invalid", () => {
    expect(isValidDrop(income, expense)).toBe(false);
  });
  it("personal → income is invalid", () => {
    expect(isValidDrop(personal, income)).toBe(false);
  });
  it("personal → same personal is invalid", () => {
    expect(isValidDrop(personal, personal)).toBe(false);
  });

  it("personal → different personal is valid", () => {
    const personal2 = makeAccount("p2", "personal");
    expect(isValidDrop(personal, personal2)).toBe(true);
  });
});

describe("useDragOperation", () => {
  const setup = () => {
    const setActiveAccount = jest.fn();
    const setRecipientAccount = jest.fn();
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useDragOperation({ setActiveAccount, setRecipientAccount, navigate }),
    );
    return { result, setActiveAccount, setRecipientAccount, navigate };
  };

  it("starts with no dragged account", () => {
    const { result } = setup();
    expect(result.current.draggedAccount).toBeNull();
    expect(result.current.hoveredTargetId).toBeNull();
  });

  it("sets draggedAccount on startDrag", () => {
    const { result } = setup();
    act(() => {
      result.current.startDrag(income);
    });
    expect(result.current.draggedAccount).toEqual(income);
  });

  it("income → personal: navigates to New operation on valid drop", () => {
    const { result, setActiveAccount, setRecipientAccount, navigate } = setup();

    act(() => {
      result.current.registerDropTarget("p1", personal, TARGET_LAYOUT);
    });
    act(() => {
      result.current.startDrag(income);
    });
    act(() => {
      result.current.endDrag(INSIDE.x, INSIDE.y);
    });

    expect(setActiveAccount).toHaveBeenCalledWith(income);
    expect(setRecipientAccount).toHaveBeenCalledWith(personal);
    expect(navigate).toHaveBeenCalledWith("New operation");
  });

  it("personal → expense: navigates to New operation on valid drop", () => {
    const { result, setActiveAccount, setRecipientAccount, navigate } = setup();

    act(() => {
      result.current.registerDropTarget("e1", expense, TARGET_LAYOUT);
    });
    act(() => {
      result.current.startDrag(personal);
    });
    act(() => {
      result.current.endDrag(INSIDE.x, INSIDE.y);
    });

    expect(setActiveAccount).toHaveBeenCalledWith(personal);
    expect(setRecipientAccount).toHaveBeenCalledWith(expense);
    expect(navigate).toHaveBeenCalledWith("New operation");
  });

  it("does not navigate when dropped outside any target", () => {
    const { result, navigate } = setup();

    act(() => {
      result.current.registerDropTarget("p1", personal, TARGET_LAYOUT);
    });
    act(() => {
      result.current.startDrag(income);
    });
    act(() => {
      result.current.endDrag(OUTSIDE.x, OUTSIDE.y);
    });

    expect(navigate).not.toHaveBeenCalled();
  });

  it("does not navigate when drop target is invalid type", () => {
    const { result, navigate } = setup();

    act(() => {
      result.current.registerDropTarget("e1", expense, TARGET_LAYOUT);
    });
    act(() => {
      result.current.startDrag(income);
    }); // income → expense = invalid
    act(() => {
      result.current.endDrag(INSIDE.x, INSIDE.y);
    });

    expect(navigate).not.toHaveBeenCalled();
  });

  it("clears draggedAccount after endDrag", () => {
    const { result } = setup();
    act(() => {
      result.current.startDrag(income);
    });
    act(() => {
      result.current.endDrag(OUTSIDE.x, OUTSIDE.y);
    });
    expect(result.current.draggedAccount).toBeNull();
  });

  it("cancelDrag clears state without navigating", () => {
    const { result, navigate } = setup();
    act(() => {
      result.current.startDrag(income);
    });
    act(() => {
      result.current.cancelDrag();
    });
    expect(result.current.draggedAccount).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("sets hoveredTargetId when dragging over valid target", () => {
    const { result } = setup();
    act(() => {
      result.current.registerDropTarget("p1", personal, TARGET_LAYOUT);
    });
    act(() => {
      result.current.startDrag(income);
    });
    act(() => {
      result.current.updateDrag(INSIDE.x, INSIDE.y);
    });
    expect(result.current.hoveredTargetId).toBe("p1");
  });

  it("clears hoveredTargetId when dragging over invalid target", () => {
    const { result } = setup();
    act(() => {
      result.current.registerDropTarget("e1", expense, TARGET_LAYOUT);
    });
    act(() => {
      result.current.startDrag(income);
    }); // income → expense = invalid
    act(() => {
      result.current.updateDrag(INSIDE.x, INSIDE.y);
    });
    expect(result.current.hoveredTargetId).toBeNull();
  });

  it("personal → personal: navigates to New operation on valid drop", () => {
    const personal2 = makeAccount("p2", "personal");
    const { result, setActiveAccount, setRecipientAccount, navigate } = setup();

    act(() => { result.current.registerDropTarget("p2", personal2, TARGET_LAYOUT); });
    act(() => { result.current.startDrag(personal); });
    act(() => { result.current.endDrag(INSIDE.x, INSIDE.y); });

    expect(setActiveAccount).toHaveBeenCalledWith(personal);
    expect(setRecipientAccount).toHaveBeenCalledWith(personal2);
    expect(navigate).toHaveBeenCalledWith("New operation");
  });

  it("dragX and dragY are updated on second startDrag after endDrag", () => {
    const { result } = setup();

    act(() => { result.current.startDrag(income, 100, 200); });
    expect(result.current.dragX.value).toBe(100);
    expect(result.current.dragY.value).toBe(200);

    act(() => { result.current.endDrag(0, 0); });

    act(() => { result.current.startDrag(income, 150, 300); });
    expect(result.current.dragX.value).toBe(150);
    expect(result.current.dragY.value).toBe(300);
    expect(result.current.draggedAccount).toEqual(income);
  });

  it("unregisterDropTarget removes target from detection", () => {
    const { result, navigate } = setup();
    act(() => {
      result.current.registerDropTarget("p1", personal, TARGET_LAYOUT);
    });
    act(() => {
      result.current.unregisterDropTarget("p1");
    });
    act(() => {
      result.current.startDrag(income);
    });
    act(() => {
      result.current.endDrag(INSIDE.x, INSIDE.y);
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
