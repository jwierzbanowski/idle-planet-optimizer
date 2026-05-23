export const MANAGER_SKILLS = [
  { value: 'empty', label: '— Empty —' },
  { value: 'allCraftSpeed', label: 'All Craft Speed' },
  { value: 'allSmeltSpeed', label: 'All Smelt Speed' },
]

export const SETTINGS_CONFIG = {
  rooms: [
    { key: 'engineering', label: 'Engineering', desc: 'Increase mine speed', baseEffect: 1.25, perLevel: 0.15, maxLevel: 60 },
    { key: 'forge', label: 'Forge', desc: 'Increase smelt speed', baseEffect: 1.20, perLevel: 0.10, maxLevel: 60 },
    { key: 'workshop', label: 'Workshop', desc: 'Increase craft speed', baseEffect: 1.20, perLevel: 0.10, maxLevel: 60 },
    { key: 'underforge', label: 'Underforge', desc: 'Decrease smelter ingredients', baseEffect: 0.90, perLevel: -0.04, maxLevel: 11 },
    { key: 'dorm', label: 'Dorm', desc: 'Decrease crafter ingredients', baseEffect: 0.90, perLevel: -0.04, maxLevel: 11 },
    { key: 'sales', label: 'Sales', desc: 'Increase alloy and item value', baseEffect: 1.15, perLevel: 0.05, maxLevel: 60 },
  ],
  projects: [
    { key: 'advancedMining', label: 'Advanced Mining' },
    { key: 'superiorMining', label: 'Superior Mining' },
    { key: 'advancedFurnace', label: 'Advanced Furnace', desc: 'Smelters speed ×1.2', baseEffect: 1.2 },
    { key: 'superiorFurnace', label: 'Superior Furnace', desc: 'Smelters speed ×1.2', baseEffect: 1.2 },
    { key: 'advancedCrafter', label: 'Advanced Crafter', desc: 'Crafters speed ×1.2', baseEffect: 1.2 },
    { key: 'superiorCrafter', label: 'Superior Crafter', desc: 'Crafters speed ×1.2', baseEffect: 1.2 },
    { key: 'advancedItemValue', label: 'Advanced Item Value' },
    { key: 'superiorItemValue', label: 'Superior Item Value' },
  ],
  beacon: [],
  station: [
    { key: 'crafting1', label: 'Crafting 1', desc: 'Craft speed', perLevel: 0.01, maxLevel: 5 },
    { key: 'crafting2', label: 'Crafting 2', desc: 'Craft speed', perLevel: 0.01, maxLevel: 10 },
    { key: 'crafting3', label: 'Crafting 3', desc: 'Craft speed', perLevel: 0.01, maxLevel: 15 },
    { key: 'crafting4', label: 'Crafting 4', desc: 'Craft speed', perLevel: 0.02, maxLevel: 20 },
    { key: 'crafting5', label: 'Crafting 5', desc: 'Craft speed', perLevel: 0.04, maxLevel: 20 },
    { key: 'smelting1', label: 'Smelting 1', desc: 'Smelt speed', perLevel: 0.01, maxLevel: 5 },
    { key: 'smelting2', label: 'Smelting 2', desc: 'Smelt speed', perLevel: 0.01, maxLevel: 10 },
    { key: 'smelting3', label: 'Smelting 3', desc: 'Smelt speed', perLevel: 0.01, maxLevel: 15 },
    { key: 'smelting4', label: 'Smelting 4', desc: 'Smelt speed', perLevel: 0.02, maxLevel: 20 },
    { key: 'smelting5', label: 'Smelting 5', desc: 'Smelt speed', perLevel: 0.04, maxLevel: 20 },
    { key: 'mining1', label: 'Mining 1' },
    { key: 'mining2', label: 'Mining 2' },
    { key: 'alloyItem1', label: 'Alloy & Item 1' },
    { key: 'alloyItem2', label: 'Alloy & Item 2' },
    { key: 'alloyItem3', label: 'Alloy & Item 3' },
    { key: 'alloyItem4', label: 'Alloy & Item 4' },
    { key: 'alloyItem5', label: 'Alloy & Item 5' },
    { key: 'alloyItem6', label: 'Alloy & Item 6' },
    { key: 'alloyItem7', label: 'Alloy & Item 7' },
  ],
  managers: [],
}

export const MARKET_VALS = [0.33, 0.5, 1, 2, 3, 4, 5]
