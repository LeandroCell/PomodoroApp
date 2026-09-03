import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#8B5E3C', '#D2B48C', '#4E9A81', '#4A7FB5', '#E6D5BE', '#6B4423'];
const PIECE_COUNT = 24;

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
}

function createPieces(width: number): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * width,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 400,
    duration: 1800 + Math.random() * 1200,
    rotation: 180 + Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
    size: 8 + Math.random() * 8,
  }));
}

function ConfettiPiece({ piece, height }: { piece: Piece; height: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.in(Easing.quad) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: piece.left,
    top: -20,
    width: piece.size,
    height: piece.size * 0.4,
    backgroundColor: piece.color,
    borderRadius: 2,
    opacity: 1 - progress.value * 0.9,
    transform: [
      { translateY: progress.value * (height + 40) },
      { rotate: `${progress.value * piece.rotation}deg` },
    ],
  }));

  return <Animated.View style={style} />;
}

/** A brief celebratory confetti burst, shown after completing a full cycle (reaching a long break). */
export function Confetti() {
  const { width, height } = useWindowDimensions();
  // Lazy initializer: the one-time randomization only ever needs to run once per mount.
  const [pieces] = useState(() => createPieces(width));

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} piece={piece} height={height} />
      ))}
    </View>
  );
}
