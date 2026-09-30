export const UPGRADE_UNLOCK_LEVEL = 4;
export const UPGRADE_MILESTONES = Object.freeze([3, 6, 9]);

export const UPGRADES = Object.freeze({
  counterweight: Object.freeze({
    name: 'Counterweight', icon: '↟', stat: 'Rise 50% faster',
    description: 'A clever pulley lifts the keep sooner after every duck. More time above ground means more time to fire.',
    summary: 'Lift the keep sooner after each duck for more firing time.',
    detail: 'Rise speed 4 → 6. Duck speed and enemy warnings stay the same.',
  }),
  archers: Object.freeze({
    name: 'Twin archers', icon: '➶', stat: 'Fire 24% more often',
    description: 'Your archers work in rhythm, sending arrows sooner. A good answer to thick armor and stubborn rams.',
    summary: 'Faster volleys wear down thick armor and stubborn rams.',
    detail: 'One arrow every 0.55s instead of 0.68s. Damage stays 1, or 2 when charged.',
  }),
  gate: Object.freeze({
    name: 'Reinforced gate', icon: '▥', stat: 'Block one breach per siege',
    description: 'An iron brace stops the first enemy at the gate without losing a heart. Cannonballs still need a well-timed duck.',
    summary: 'Stop the first enemy at your gate. Cannonballs still hurt.',
    detail: 'One block, renewed every siege. Further breaches cause normal damage.',
  }),
});

export function validUpgrade(value) {
  return typeof value === 'string' && Object.hasOwn(UPGRADES, value) ? value : null;
}
