# Implementation Plan: Advanced Analytics (Trends & Bottlenecks)

This plan outlines the design and implementation details for adding two new advanced reports: **Period-over-Period Performance Trends** and **Delay & Bottleneck (Overtime) Analysis** inside the Analytics space of the Daily Tracker.

---

## 1. User Interface Design

A new sub-tab navigation will be introduced within the **Analytics** tab of the dashboard to keep the view clean and uncluttered:

```
[ Analytics (Tab) ]
  ├── Overview (Default dashboard view)
  └── Trends & Bottlenecks (New advanced reports)
```

In the **Trends & Bottlenecks** workspace, we will render:
1. **Trend Configuration Bar**: Selector for trend interval (*Monthly*, *Quarterly*, *Yearly*).
2. **Chronological Trend Line Chart**: Visualizing Target Achievement % and Time Efficiency % across intervals.
3. **Delay & Overtime Metrics Cards**:
   - Total Overtime Logs (logs where `takenTime > estimatedTime`).
   - Total Delay Hours accumulated.
   - Average Delay % across all delayed logs.
4. **Bottleneck Task List & Suggestions**:
   - Table showing task types with the highest delays.
   - Dynamic recommendation engine showing target modifications.
5. **Overtime Audit Table**: A detailed log of tasks that exceeded estimated hours.

---

## 2. Proposed Metrics & Formulas

### A. Chronological Intervals
Dates will be bucketed based on the selected interval:
* **Monthly**: `YYYY-MM` (e.g. `2026-06`)
* **Quarterly**: `YYYY- [Q]Q` (e.g. `2026-Q2`)
* **Yearly**: `YYYY` (e.g. `2026`)

### B. Delay & Overtime Metrics
For entries where `takenTime > estimatedTime`:
* **Delay Hours (Task)**: $\Delta t = \text{takenTime} - \text{estimatedTime}$
* **Delay % (Task)**: $\text{Delay \%} = \left(\frac{\text{takenTime} - \text{estimatedTime}}{\text{estimatedTime}}\right) \times 100$
* **Overall Avg Delay %**: $\frac{\sum \text{Delay \%}}{\text{Total Delayed Logs}}$

### C. Smart Target Corrections
If a specific task type (e.g., `Style Editing`) repeatedly has an average delay of more than $20\%$:
* **Recommendation**: $\text{Suggested Target} = \text{Current Target} \times (1 - \text{Average Delay \%})$

---

## 3. Proposed File Changes

### [MODIFY] [Dashboard.jsx](file:///d:/Daily-Tracker/src/components/Dashboard.jsx)

* **Add States**:
  ```javascript
  const [analyticsSubTab, setAnalyticsSubTab] = useState('overview'); // 'overview' or 'trends'
  const [trendPeriod, setTrendPeriod] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'
  ```
* **Render Layout**:
  - Add sub-tab buttons `Overview` and `Trends & Bottlenecks` at the top of the analytics section.
  - Implement conditional rendering based on `analyticsSubTab`.
* **Trends Computations**:
  - Group chronological logs, compute averages, and output a sorted dataset for the `Line` chart component.
* **Overtime Computations**:
  - Filter `filteredEntries` where `takenTime > estimatedTime`.
  - Group by `taskType` to compute average delays and target recommendations.
  - Render an audit table of these delayed logs.

### [MODIFY] [App.jsx](file:///d:/Daily-Tracker/src/App.jsx)
* No schema or database changes required since all parameters are already fetched and passed to the `<Dashboard />` component.

---

## 4. Verification Plan

### Automated Build Verification
* Run `cmd /c "npm run build"` to verify that chart.js configurations, line rendering, and math formulas compile without syntax warnings.

### Manual Layout Checklist
* **Theme check**: Verify trend lines and report cards are readable in both Light and Dark themes.
* **Data consistency check**: Verify that filtering by performer scopes the chronological trends and overtime reports correctly to that performer.
* **Smart suggestion check**: Input a mock status entry where `takenTime` is double the `estimatedTime` and verify that the target correction algorithm fires a recommendation for that task type.
