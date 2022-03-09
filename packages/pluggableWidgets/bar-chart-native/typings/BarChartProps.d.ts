/**
 * This file was generated from BarChart.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { DynamicValue, ListValue, ListAttributeValue, ListExpressionValue } from "mendix";
import { Big } from "big.js";

export type PresentationEnum = "grouped" | "stacked";

export type DataSetEnum = "static" | "dynamic";

export interface BarSeriesType {
    dataSet: DataSetEnum;
    staticDataSource?: ListValue;
    dynamicDataSource?: ListValue;
    groupByAttribute?: ListAttributeValue<string | boolean | Date | Big>;
    staticSeriesName?: DynamicValue<string>;
    dynamicSeriesName?: ListExpressionValue<string>;
    staticXAttribute?: ListAttributeValue<Date | Big | string>;
    dynamicXAttribute?: ListAttributeValue<Date | Big | string>;
    staticYAttribute?: ListAttributeValue<Date | Big | string>;
    dynamicYAttribute?: ListAttributeValue<Date | Big | string>;
    staticCustomBarStyle: string;
    dynamicCustomBarStyle?: ListAttributeValue<string>;
}

export type SortOrderEnum = "ascending" | "descending";

export interface TickValuesObjectType {
    tickValue: number;
}

export interface TickFormatObjectType {
    tickFormat: string;
}

export interface BarSeriesPreviewType {
    dataSet: DataSetEnum;
    staticDataSource: {} | { type: string } | null;
    dynamicDataSource: {} | { type: string } | null;
    groupByAttribute: string;
    staticSeriesName: string;
    dynamicSeriesName: string;
    staticXAttribute: string;
    dynamicXAttribute: string;
    staticYAttribute: string;
    dynamicYAttribute: string;
    staticCustomBarStyle: string;
    dynamicCustomBarStyle: string;
}

export interface TickValuesObjectPreviewType {
    tickValue: number | null;
}

export interface TickFormatObjectPreviewType {
    tickFormat: string;
}

export interface BarChartProps<Style> {
    name: string;
    style: Style[];
    presentation: PresentationEnum;
    barSeries: BarSeriesType[];
    sortOrder: SortOrderEnum;
    showLabels: boolean;
    showLegend: boolean;
    xAxisLabel?: DynamicValue<string>;
    yAxisLabel?: DynamicValue<string>;
    tickValuesObject: TickValuesObjectType[];
    tickFormatObject: TickFormatObjectType[];
}

export interface BarChartPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    presentation: PresentationEnum;
    barSeries: BarSeriesPreviewType[];
    sortOrder: SortOrderEnum;
    showLabels: boolean;
    showLegend: boolean;
    xAxisLabel: string;
    yAxisLabel: string;
    tickValuesObject: TickValuesObjectPreviewType[];
    tickFormatObject: TickFormatObjectPreviewType[];
}
