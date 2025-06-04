// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'dollarsign.circle.fill': 'account-balance-wallet',
  'gear': 'settings',
  'chart.pie.fill': 'pie-chart',
  'chart.bar.fill': 'bar-chart',
  'banknote.fill': 'account-balance',
  'bell.fill': 'notifications',
  'cart.fill': 'shopping-cart',
  'car.fill': 'directions-car',
  'bolt.fill': 'flash-on',
  'film.fill': 'movie',
  'heart.fill': 'favorite',
  'bag.fill': 'shopping-bag',
  'ellipsis.circle.fill': 'more-horiz',
  'briefcase.fill': 'work',
  'chart.line.uptrend.xyaxis.fill': 'trending-up',
  'gift.fill': 'card-giftcard',
  'plus.circle.fill': 'add-circle',
  'minus.circle.fill': 'remove-circle',
  'list.bullet': 'list',
  'arrow.down.circle.fill': 'arrow-circle-down',
  'arrow.up.circle.fill': 'arrow-circle-up',
  'calendar': 'calendar-today',
  'xmark.circle.fill': 'cancel',
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
