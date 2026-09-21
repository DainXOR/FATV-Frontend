# FormCreator Weight Configuration Guide

This document explains the default weight configuration for the FormCreator component and how to customize it.

## Overview

The FormCreator component now has centralized configuration for weight behaviors and defaults. All configuration constants are located in a single file for easy modification.

## Configuration File

**Location:** `src/config/FormCreatorConfig.js`

All weight-related settings are defined as exported constants that can be easily modified without searching through the component code.

## Configuration Options

### Section Weights

#### `TOTAL_SECTIONS`
- **Type:** `number`
- **Default:** `4`
- **Description:** Total number of sections in the form
- **When to change:** If you add/remove sections from the form structure

#### `DEFAULT_SECTION_WEIGHT`
- **Type:** `number` (percentage)
- **Default:** `25`
- **Description:** Default weight per section when first initialized
- **When to change:** If you want to change the initial distribution (e.g., 20% per section for 5 sections)

#### `INITIAL_SECTION_WEIGHTS`
- **Type:** `{[SectionType]: number}`
- **Default:** 
  ```javascript
  {
    academic: 25,
    socioeconomic: 25,
    relacional: 25,
    socioemotional: 25
  }
  ```
- **Description:** Initial weight distribution for all sections. Must total 100%
- **When to change:** If you want different weights per section (e.g., academic 30%, others 23.33%)

### Question Weights

#### `INITIAL_QUESTION_WEIGHT`
- **Type:** `number`
- **Default:** `0`
- **Description:** Starting value for question weights before auto-distribution is applied
- **When to change:** Rarely needed; keeps the internal representation clean

#### `AUTO_DISTRIBUTE_QUESTION_WEIGHTS`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enable automatic weight distribution for questions
- **Behavior when `true`:**
  - Questions divide section weight equally
  - Example: 1 question = 100%, 2 questions = 50% each, 4 questions = 25% each
- **Behavior when `false`:**
  - All weights are manual; no auto-distribution
  - Users must explicitly set all question weights

#### `TOTAL_QUESTION_WEIGHT_PER_SECTION`
- **Type:** `number` (percentage)
- **Default:** `100`
- **Description:** Total weight available to distribute among questions in a section
- **When to change:** Only if sections have multiple weight pools (rare)

### Behavior Flags

#### `PRIORITIZE_EDITED_WEIGHTS`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Controls weight distribution when some questions have been manually edited
- **Behavior when `true`:**
  - Once any question weight is manually edited, new questions added to that section get the **remaining weight** to reach 100%
  - Example: 2 questions, both at 50% each. Edit first to 60%. New third question gets 40%
  - Remaining questions (if any) divide the new remainder equally
- **Behavior when `false`:**
  - All new questions always get equal distribution, regardless of edits
  - Example: 2 questions at 50% each. Edit first to 60%. New third question still gets 33.33% (1/3 of 100%)

#### `TRACK_EDITED_WEIGHTS`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enable tracking of manually edited question weights
- **When to change:** Set to `false` if you want all weights to be treated as equal without special handling

## Utility Functions

### `calculateEqualWeight(questionCount)`

Calculates equal weight distribution across questions.

```javascript
calculateEqualWeight(1)  // Returns 100
calculateEqualWeight(2)  // Returns 50
calculateEqualWeight(4)  // Returns 25
```

**Parameters:**
- `questionCount` (number): Number of questions to distribute weight across

**Returns:** Weight per question (as percentage)

**Usage:** Used internally for auto-distribution; you shouldn't need to call this directly

## How Weight Distribution Works

### Scenario 1: No Manual Edits (Default Behavior)

1. User selects 1 question → Weight is 100%
2. User selects 2 questions (both in same section) → Each gets 50%
3. User selects 3 questions → Each gets 33.33%

### Scenario 2: With Manual Edits (When `PRIORITIZE_EDITED_WEIGHTS = true`)

1. User selects 2 questions → Each gets 50%
2. User edits first question to 60% → First is marked as "edited"
3. User adds 3rd question → Gets remaining 40%
4. User adds 4th question → Shares the 40% with question 3 → Each gets 20%
5. If user edits the 3rd question now → It's marked as "edited" too
6. Any new questions continue to share the remaining weight among unedited questions

### Scenario 3: Different Sections

Questions in different sections are weighted independently.

```
Academic section:     2 questions → 50% each
Socioeconomic:        3 questions → 33.33% each
Relacional:          1 question  → 100%
Socioemotional:      0 questions → (no questions)
```

## Component Integration

The FormCreator component tracks edited weights in a Set:

```javascript
const [editedQuestionWeights, setEditedQuestionWeights] = useState(new Set());
```

This Set is updated automatically when:
- A question weight is manually changed
- A question is removed from selection

The component provides visual hints to users:
- **Auto-distributed:** "Auto-distribución: 25% cada pregunta (4 preguntas)"
- **Manually edited:** "Peso manual - este peso no se redistribuirá"
- **Remainder distribution:** "Distribuye el peso restante entre 2 preguntas no editadas"

## Common Customization Scenarios

### Scenario A: Change Default Section Weights

✏️ **File:** `src/config/FormCreatorConfig.js`

```javascript
// Give more weight to academic section, less to others
export const INITIAL_SECTION_WEIGHTS = {
  academic: 40,
  socioeconomic: 20,
  relacional: 20,
  socioemotional: 20
};
```

### Scenario B: Disable Auto-Distribution

✏️ **File:** `src/config/FormCreatorConfig.js`

```javascript
// All weights must be set manually
export const AUTO_DISTRIBUTE_QUESTION_WEIGHTS = false;
```

### Scenario C: Always Equal Distribution (Ignore Edits)

✏️ **File:** `src/config/FormCreatorConfig.js`

```javascript
// New questions always get equal share, never prioritize existing edits
export const PRIORITIZE_EDITED_WEIGHTS = false;
```

### Scenario D: Disable Weight Edit Tracking

✏️ **File:** `src/config/FormCreatorConfig.js`

```javascript
// Don't track which questions were edited manually
export const TRACK_EDITED_WEIGHTS = false;
```

## Validation

The form validates that:
1. **Section weights:** All questions within a section sum to 100%
2. **Total section weights:** All section weights sum to 100%

These validations happen when generating the form URL and provide clear error messages if weights don't add up.

## Implementation Details

### State Management

- **`editedQuestionWeights`**: Set tracking which questions have been manually edited
  - Updated when: weight changes, question removed
  - Used for: prioritizing remainder distribution
  
- **`selectedQuestionConfigs`**: Map of all question configurations
  - Includes: section, weight, optional flag, dependencies
  - Updated when: any configuration changes

### Weight Calculation Flow

1. **Adding a question:**
   - Check if auto-distribution is enabled
   - Get all questions in target section
   - If none edited: use equal distribution
   - If some edited: use remainder distribution
   - Set calculated weight

2. **Moving a question to different section:**
   - Recalculate weights for old section
   - Recalculate weights for new section
   - Only affect unedited questions

3. **Manually editing a weight:**
   - Mark question as edited
   - Don't recalculate other questions immediately
   - Will affect new questions added to that section

## Technical Notes

- Auto-distribution uses rounding to 2 decimal places
- Section moves trigger animation via FLIP technique
- Edit tracking is case-sensitive (question IDs must match exactly)
- All percentages use the range 0-100

## Debugging Tips

To check current configuration values in the browser console:

```javascript
// After opening FormCreator, check the config
import { AUTO_DISTRIBUTE_QUESTION_WEIGHTS, PRIORITIZE_EDITED_WEIGHTS } from './config/FormCreatorConfig';
console.log({ AUTO_DISTRIBUTE_QUESTION_WEIGHTS, PRIORITIZE_EDITED_WEIGHTS });
```

To inspect the current state in React DevTools:
1. Open React DevTools
2. Select the FormCreator component
3. Check:
   - `editedQuestionWeights`: Set of edited question IDs
   - `selectedQuestionConfigs`: All question configurations
   - `sectionWeights`: Current section weights
