# Timeline Filter Feature

This branch implements a timeline filter feature for Gephi Lite that allows users to filter graph edges based on date/timestamp attributes.

## Overview

The timeline filter enables visualization of how a graph changes over time by allowing users to select a time range using a slider. Only edges with timestamps falling within the selected range will be displayed.

## Features Implemented

1. **Timeline Filter Type**: A new `TimelineFilterType` that extends the existing filter system to handle temporal data on edges.

2. **Filtering Logic**: Edge filtering based on date/timestamp values using the Luxon DateTime library for robust date handling.

3. **Timeline Slider UI**: An interactive slider component similar to the RangeFilter, but specifically designed for temporal data with:
   - Visual histogram showing edge distribution over time
   - Date range selection
   - Min/max date displays in human-readable format

4. **Filter Panel Integration**: Timeline filter is automatically available when date-type fields are detected on edges.

5. **Sample Data**: A "Social Network Timeline" sample graph demonstrating the feature with timestamped edges.

## How to Use

1. **Load a graph with temporal edge data**: The graph must have edges with a date-type attribute.

2. **Add a timeline filter**:
   - Open the Filters panel
   - Click "Add filter"
   - Under "Edges fields", select a date attribute
   - The timeline filter will be created automatically for date fields on edges

3. **Adjust the time range**:
   - Use the slider to select the desired time range
   - The graph will update in real-time to show only edges within that range
   - The histogram shows the distribution of edges over time

4. **Try the sample**: Load "Social Network Timeline.json" from the samples to see the feature in action.

## Technical Details

### File Changes

**SDK Package (`packages/sdk/`):**
- `src/filters/types.ts`: Added `TimelineFilterType` interface

**Gephi-Lite Package (`packages/gephi-lite/`):**
- `src/core/filters/types.ts`: Exported `TimelineFilterType`
- `src/core/filters/utils.ts`: Added timeline filtering logic in `filterValue()`
- `src/components/GraphFilters/TimelineFilter.tsx`: New timeline slider component
- `src/components/GraphFilters/index.tsx`: Integrated timeline filter
- `src/components/modals/SelectFilterModal.tsx`: Auto-select timeline filter for edge date fields
- `src/locales/en.json`: Added timeline filter translations
- `public/samples/Social Network Timeline.json`: Sample graph with temporal data

### Data Format

Edges must have a date attribute defined in the `edgeFields` with:
```json
{
  "id": "timestamp",
  "itemType": "edges",
  "type": "date",
  "format": "yyyy-MM-dd"  // or any Luxon-compatible format
}
```

Edge data should include the timestamp:
```json
"edgeData": {
  "e1": {
    "timestamp": "2023-01-15",
    "weight": 5
  }
}
```

## Future Enhancements (Optional)

The following features could be added in future iterations:

- **Animation Controls**: Play/pause buttons to automatically advance through time
- **Playback Speed**: Adjustable speed for timeline animation
- **Step Controls**: Previous/next buttons to move through time in discrete steps
- **Time Granularity**: Options to group by day, month, quarter, year
- **Range Presets**: Quick select buttons for common ranges (last month, last year, etc.)
- **Timeline Visualization**: More sophisticated timeline visualization options

## Testing

To test the feature:

1. Start the development server: `npm start`
2. Navigate to http://localhost:5173/gephi-lite/
3. Load the "Social Network Timeline" sample graph
4. Add a timeline filter on the "timestamp" edge field
5. Adjust the slider to see edges appear/disappear based on the selected time range

## Notes

- Timeline filters only work on edges (not nodes)
- The date format must be specified in the field definition
- Missing or invalid dates can be optionally kept using the "Keep missing values" option
- The filter uses Luxon's DateTime internally for robust date handling
