import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { TimerPhase, TimerState } from '@/features/timer/types';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

const VIEW_WIDTH = 220;
const VIEW_HEIGHT = 260;

const CUP_BODY_PATH = 'M56,64 L164,64 L164,182 Q164,200 146,200 L74,200 Q56,200 56,182 Z';
const CUP_INNER_PATH = 'M64,74 L156,74 L156,178 Q156,190 144,190 L76,190 Q64,190 64,178 Z';
const HANDLE_PATH = 'M164,92 Q200,92 200,126 Q200,160 164,160';

const INNER_TOP = 74;
const INNER_BOTTOM = 190;
const INNER_HEIGHT = INNER_BOTTOM - INNER_TOP;
const INNER_X = 64;
const INNER_WIDTH = 156 - 64;

const PHASE_COLORS: Record<
  TimerPhase,
  {
    liquid: string;
    liquidDark: string;
    cupBody: string;
    outline: string;
    steam: string;
    empty: string;
    outlineOnDark: string;
  }
> = {
  work: {
    liquid: '#7A4A2A',
    liquidDark: '#4A2E19',
    cupBody: '#FBF6EF',
    outline: '#3A2314',
    outlineOnDark: '#E6D5BE',
    steam: '#D8C7B2',
    empty: '#2B1E14',
  },
  shortBreak: {
    liquid: '#5FAE93',
    liquidDark: '#356E5C',
    cupBody: '#F5EFE6',
    outline: '#2F4A40',
    outlineOnDark: '#CFEFE1',
    steam: '#C9EADD',
    empty: '#1F332C',
  },
  longBreak: {
    liquid: '#5A8FC4',
    liquidDark: '#325A82',
    cupBody: '#F5EFE6',
    outline: '#22384F',
    outlineOnDark: '#CFE1F5',
    steam: '#CADFF2',
    empty: '#1B2C3E',
  },
};

interface CoffeeCupProps {
  state: TimerState;
  size?: number;
  isDark?: boolean;
}

export function CoffeeCup({ state, size = 220, isDark = false }: CoffeeCupProps) {
  const colors = PHASE_COLORS[state.phase];
  const outlineColor = isDark ? colors.outlineOnDark : colors.outline;
  const isRunning = state.status === 'running';

  const fill = useSharedValue(state.totalMs > 0 ? state.remainingMs / state.totalMs : 0);
  const steamOpacity = useSharedValue(0);
  const steamA = useSharedValue(0);
  const steamB = useSharedValue(0);

  // One continuous, driftless animation per "generation" (start/resume/skip/pause/reset), rather
  // than re-triggering a new tween on every ~250ms tick.
  useEffect(() => {
    cancelAnimation(fill);
    if (state.status === 'running' && state.targetTimestamp != null && state.totalMs > 0) {
      const msLeft = Math.max(0, state.targetTimestamp - Date.now());
      fill.value = Math.min(1, Math.max(0, msLeft / state.totalMs));
      fill.value = withTiming(0, { duration: msLeft, easing: Easing.linear });
    } else {
      const target = state.totalMs > 0 ? state.remainingMs / state.totalMs : 0;
      fill.value = withTiming(target, { duration: 350, easing: Easing.out(Easing.quad) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.targetTimestamp, state.totalMs, state.phase]);

  useEffect(() => {
    steamOpacity.value = withTiming(isRunning ? 1 : 0, { duration: 400 });
    if (isRunning) {
      steamA.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1
      );
      steamB.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(-14, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })
        ),
        -1
      );
    } else {
      cancelAnimation(steamA);
      cancelAnimation(steamB);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const liquidProps = useAnimatedProps(() => {
    const height = fill.value * INNER_HEIGHT;
    return { y: INNER_BOTTOM - height, height: Math.max(0, height) };
  });

  const foamProps = useAnimatedProps(() => {
    const height = fill.value * INNER_HEIGHT;
    return { y: INNER_BOTTOM - height, opacity: fill.value > 0.02 ? 1 : 0 };
  });

  const steamAProps = useAnimatedProps(() => ({
    opacity: steamOpacity.value,
    transform: [{ translateY: steamA.value }],
  }));
  const steamBProps = useAnimatedProps(() => ({
    opacity: steamOpacity.value * 0.8,
    transform: [{ translateY: steamB.value }],
  }));

  const gradientId = `liquidGradient-${state.phase}`;
  const clipId = `innerCup-${state.phase}`;

  return (
    <View
      style={{ width: size, height: (size * VIEW_HEIGHT) / VIEW_WIDTH }}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={CUP_INNER_PATH} />
          </ClipPath>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.liquid} />
            <Stop offset="1" stopColor={colors.liquidDark} />
          </LinearGradient>
        </Defs>

        <Ellipse cx={110} cy={210} rx={72} ry={10} fill="rgba(20,14,8,0.12)" />

        <AnimatedG animatedProps={steamAProps}>
          <Path
            d="M88,52 C76,40 96,28 86,14"
            stroke={colors.steam}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        </AnimatedG>
        <AnimatedG animatedProps={steamBProps}>
          <Path
            d="M126,52 C114,38 134,30 124,12"
            stroke={colors.steam}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        </AnimatedG>

        <Path d={HANDLE_PATH} stroke={outlineColor} strokeWidth={12} strokeLinecap="round" fill="none" />
        <Path d={CUP_BODY_PATH} fill={colors.cupBody} stroke={outlineColor} strokeWidth={6} />

        <G clipPath={`url(#${clipId})`}>
          <Rect x={INNER_X} y={INNER_TOP} width={INNER_WIDTH} height={INNER_HEIGHT} fill={colors.empty} />
          <AnimatedRect
            x={INNER_X}
            width={INNER_WIDTH}
            fill={`url(#${gradientId})`}
            animatedProps={liquidProps}
          />
          <AnimatedRect
            x={INNER_X}
            width={INNER_WIDTH}
            height={3}
            fill={colors.liquid}
            animatedProps={foamProps}
          />
        </G>

        <Path
          d="M64,74 Q110,86 156,74"
          stroke={outlineColor}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      </Svg>
    </View>
  );
}
