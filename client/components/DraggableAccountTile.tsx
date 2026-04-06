import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { Account } from "../src/types";
import { DropTargetLayout } from "../hooks/useDragOperation";
import { colors } from "../styles/styles";

interface Props {
  account: Account;
  children: React.ReactNode;
  onDragStart: (account: Account, x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onRegister: (id: string, account: Account, layout: DropTargetLayout) => void;
  onUnregister: (id: string) => void;
  onRegisterRemeasure: (id: string, fn: () => void) => void;
  onUnregisterRemeasure: (id: string) => void;
  isHovered: boolean;
  isDraggable: boolean;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragVisible: SharedValue<boolean>;
}

export default function DraggableAccountTile({
  account,
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  onRegister,
  onUnregister,
  onRegisterRemeasure,
  onUnregisterRemeasure,
  isHovered,
  isDraggable,
  dragX,
  dragY,
  dragVisible,
}: Props) {
  const viewRef = useRef<View>(null);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);

  const measure = useCallback(() => {
    viewRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      if (width > 0) {
        onRegister(account._id, account, { pageX, pageY, width, height });
      }
    });
  }, [account, onRegister]);

  // Register remeasure callback so drag start can refresh all positions
  useEffect(() => {
    onRegisterRemeasure(account._id, measure);
    return () => onUnregisterRemeasure(account._id);
  }, [account._id, measure, onRegisterRemeasure, onUnregisterRemeasure]);

  useEffect(() => {
    return () => onUnregister(account._id);
  }, [account._id, onUnregister]);

  const startDragJS = useCallback(
    (x: number, y: number) => {
      onDragStart(account, x, y);
    },
    [account, onDragStart],
  );

  const longPress = Gesture.LongPress()
    .minDuration(100)
    .onStart((e) => {
      "worklet";
      // Set on UI thread immediately — no JS bridge delay
      dragX.value = e.absoluteX;
      dragY.value = e.absoluteY;
      dragVisible.value = true;
      isDragging.value = true;
      scale.value = withSpring(0.85);
      runOnJS(startDragJS)(e.absoluteX, e.absoluteY);
    });

  const pan = Gesture.Pan()
    .activateAfterLongPress(100)
    .onUpdate((e) => {
      "worklet";
      dragX.value = e.absoluteX;
      dragY.value = e.absoluteY;
      runOnJS(onDragMove)(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      "worklet";
      dragVisible.value = false;
      isDragging.value = false;
      scale.value = withSpring(1);
      runOnJS(onDragEnd)(e.absoluteX, e.absoluteY);
    })
    .onFinalize(() => {
      "worklet";
      if (isDragging.value) {
        dragVisible.value = false;
        isDragging.value = false;
        scale.value = withSpring(1);
      }
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    zIndex: isDragging.value ? 100 : 1,
    opacity: isDragging.value ? 0.4 : 1,
  }));

  return (
    <View ref={viewRef} onLayout={measure} collapsable={false}>
      {isDraggable ? (
        <GestureDetector gesture={composed}>
          <Animated.View
            style={[animatedStyle, isHovered && styles.hoverTarget]}
          >
            {children}
          </Animated.View>
        </GestureDetector>
      ) : (
        <View style={[isHovered && styles.hoverTarget]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hoverTarget: {
    backgroundColor: "rgba(70,241,197,0.2)",
    borderRadius: 16,
    padding: -4,
  },
});
