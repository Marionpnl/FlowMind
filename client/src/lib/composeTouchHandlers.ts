// Combine deux jeux de handlers tactiles destinés au MÊME nœud DOM — ex. les
// activateurs `onTouchStart`/`onTouchMove`/`onTouchEnd` de dnd-kit (issus de
// `listeners`) et ceux de `useLongPress` (révélation du bouton supprimer).
//
// Spreadés l'un après l'autre en JSX (`{...listeners} {...longPressTouchHandlers}`),
// le second écraserait complètement le premier pour chaque clé en commun —
// React ne garde que la dernière prop assignée, il ne les additionne pas.
// Résultat réel observé : le glisser tactile ne démarrait plus du tout sur
// Day/Week/Month (seul `useLongPress` recevait encore `onTouchStart`), alors
// que TodayPlanning n'était pas touché puisque ses deux jeux de handlers
// vivent sur deux éléments DOM différents (le `<li>` vs la carte imbriquée).

export type HandlerMap = Record<string, ((event: never) => void) | undefined>;

export function composeTouchHandlers(
  ...handlerMaps: (HandlerMap | undefined)[]
): HandlerMap {
  const maps = handlerMaps.filter((map): map is HandlerMap => Boolean(map));
  const keys = new Set(maps.flatMap((map) => Object.keys(map)));
  const merged: HandlerMap = {};
  keys.forEach((key) => {
    merged[key] = (event) => {
      maps.forEach((map) => map[key]?.(event));
    };
  });
  return merged;
}
