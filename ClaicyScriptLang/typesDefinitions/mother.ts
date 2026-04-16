import {CSString, CSPropertyNameType} from "./primitives"
/** The abstract basis of everything typed, all the dynamic possibilities are here */
export interface CSValue {
    type: CSString;
};