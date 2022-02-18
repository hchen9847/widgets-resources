/**
 * This file was generated from ColorPicker.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type DisplayModeEnum = "popover" | "advanced";

export type AdvancedDisplayEnum = "input" | "inline";

export type TypeEnum =
    | "block"
    | "chrome"
    | "circle"
    | "compact"
    | "github"
    | "hue"
    | "material"
    | "sketch"
    | "slider"
    | "swatches"
    | "twitter";

export type FormatEnum = "hex" | "rgb" | "rgba";

export interface DefaultColorsType {
    color: string;
}

export interface DefaultColorsPreviewType {
    color: string;
}

export interface ColorPickerContainerProps {
    name: string;
    tabIndex?: number;
    id: string;
    colorAttribute: EditableValue<string>;
    advanced: boolean;
    displayMode: DisplayModeEnum;
    advancedDisplay: AdvancedDisplayEnum;
    type: TypeEnum;
    format: FormatEnum;
    defaultColors: DefaultColorsType[];
    invalidFormatMessage?: DynamicValue<string>;
    onChange?: ActionValue;
}

export interface ColorPickerPreviewProps {
    readOnly: boolean;
    colorAttribute: string;
    advanced: boolean;
    displayMode: DisplayModeEnum;
    advancedDisplay: AdvancedDisplayEnum;
    type: TypeEnum;
    format: FormatEnum;
    defaultColors: DefaultColorsPreviewType[];
    invalidFormatMessage: string;
    onChange: {} | null;
}
