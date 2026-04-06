import { useState, useRef, useCallback } from "react";
import { useSharedValue } from "react-native-reanimated";
import { Account } from "../src/types";

export interface DropTargetLayout {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

interface DropTarget {
  account: Account;
  layout: DropTargetLayout;
}

interface UseDragOperationOptions {
  setActiveAccount: (acc: Account | null) => void;
  setRecipientAccount: (acc: Partial<Account>) => void;
  navigate: (screen: string, params?: Record<string, any>) => void;
}

export function isValidDrop(source: Account, target: Account): boolean {
  return (
    (source.type === "income" && target.type === "personal") ||
    (source.type === "personal" && target.type === "expense") ||
    (source.type === "personal" && target.type === "personal" && source._id !== target._id) ||
    (source.type === "personal" && target.type === "debt") ||
    (source.type === "debt" && target.type === "personal") ||
    (source.type === "personal" && target.type === "asset") ||
    (source.type === "asset" && target.type === "personal")
  );
}

export function useDragOperation({
  setActiveAccount,
  setRecipientAccount,
  navigate,
}: UseDragOperationOptions) {
  const [draggedAccount, setDraggedAccount] = useState<Account | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  // UI-thread shared values — updated directly in worklets, no React re-render
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragVisible = useSharedValue(false);

  const dropTargets = useRef<Map<string, DropTarget>>(new Map());
  const remeasureCallbacks = useRef<Map<string, () => void>>(new Map());

  const registerRemeasure = useCallback((id: string, fn: () => void) => {
    remeasureCallbacks.current.set(id, fn);
  }, []);

  const unregisterRemeasure = useCallback((id: string) => {
    remeasureCallbacks.current.delete(id);
  }, []);

  const registerDropTarget = useCallback(
    (id: string, account: Account, layout: DropTargetLayout) => {
      dropTargets.current.set(id, { account, layout });
    },
    []
  );

  const unregisterDropTarget = useCallback((id: string) => {
    dropTargets.current.delete(id);
  }, []);

  const getTargetAt = (x: number, y: number): DropTarget | null => {
    for (const target of dropTargets.current.values()) {
      const { pageX, pageY, width, height } = target.layout;
      if (x >= pageX && x <= pageX + width && y >= pageY && y <= pageY + height) {
        return target;
      }
    }
    return null;
  };

  const startDrag = useCallback((account: Account, x: number, y: number) => {
    remeasureCallbacks.current.forEach((fn) => fn());
    dragX.value = x;
    dragY.value = y;
    setDraggedAccount(account);
    setHoveredTargetId(null);
  }, [dragX, dragY]);

  const updateDrag = useCallback(
    (x: number, y: number) => {
      setDraggedAccount((current) => {
        if (!current) return current;
        const target = getTargetAt(x, y);
        setHoveredTargetId(
          target && isValidDrop(current, target.account) ? target.account._id : null
        );
        return current;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const endDrag = useCallback(
    (x: number, y: number) => {
      setDraggedAccount((current) => {
        if (current) {
          const target = getTargetAt(x, y);
          if (target && isValidDrop(current, target.account)) {
            if (current._id === "__debts__") {
              // Debts tile → personal: "borrow from someone" or "receive repayment"
              setActiveAccount(null);
              setRecipientAccount(target.account);
              navigate("New operation", { debtMode: "borrow" });
            } else if (target.account._id === "__debts__") {
              // Personal → Debts tile: "lend to someone" or "repay someone"
              setActiveAccount(current);
              setRecipientAccount({});
              navigate("New operation", { debtMode: "lend" });
            } else if (current._id === "__assets__") {
              // Assets tile → personal: selling an asset
              setActiveAccount(null);
              setRecipientAccount(target.account);
              navigate("New operation", { assetMode: "sell" });
            } else if (target.account._id === "__assets__") {
              // Personal → Assets tile: buying an asset
              setActiveAccount(current);
              setRecipientAccount({});
              navigate("New operation", { assetMode: "buy" });
            } else {
              setActiveAccount(current);
              setRecipientAccount(target.account);
              navigate("New operation");
            }
          }
        }
        return null;
      });
      setHoveredTargetId(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setActiveAccount, setRecipientAccount, navigate]
  );

  const cancelDrag = useCallback(() => {
    setDraggedAccount(null);
    setHoveredTargetId(null);
    dragVisible.value = false;
  }, [dragVisible]);

  return {
    draggedAccount,
    hoveredTargetId,
    dragX,
    dragY,
    dragVisible,
    registerDropTarget,
    unregisterDropTarget,
    registerRemeasure,
    unregisterRemeasure,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  };
}
