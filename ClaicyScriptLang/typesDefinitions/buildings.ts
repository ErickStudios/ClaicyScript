import {CSPropertyNameType, CSString, CSNumber, CSBoolean} from "./primitives"
import { CSValue } from "./mother"
/** base of the scopes and objects */
export type CSObjectPropertys = { [key: CSPropertyNameType]: CSBaseAllValues };
/** all possible values in the lang */
export type CSBaseAllValues = CSFunction | CSValue | CSObject | CSArray | CSUserFunction | CSInterface | CSNumber | CSString | CSBoolean | CSPropertyNameType;
/** array items */
export type CSArrayInternalItems = CSBaseAllValues[];
/** function params */
export type CSFunctionCallbackParams = CSArrayInternalItems;
/** function */
export type CSFunctionCallback = (params: CSFunctionCallbackParams, scope?: CSObjectPropertys) => CSBaseAllValues | Promise<CSBaseAllValues>;
/** a function callable from the internal lang engine to the user code */
export interface CSFunction extends CSValue {
    func: CSFunctionCallback;
}
/** a object, a dictionary that contains whatever that you want */
export interface CSObject extends CSValue {
    object: CSObjectPropertys;
    classesHeredated?: CSBaseAllValues[];
    interfaces?: CSInterface[];
}
/** a array, a list of enumerable things, from index start 0. 0... 1... 2... to the infinity */
export interface CSArray extends CSValue {
    items: CSArrayInternalItems;
}
/** a user function, a function defined by the user */
export interface CSUserFunction extends CSValue {
    params: string[],
    body: any,
    expectatives?: string[]
}
/** a interface, a pact that the codes makes with a class and a base */
export interface CSInterface extends CSValue {
    props: Record<string, string>;
    name?: CSString;
}
/** exports the required things */
export { CSValue, CSPropertyNameType, CSString, CSNumber, CSBoolean };
/** exports the values */
export namespace ClaicyScript {
    export type BaseAllValues = CSBaseAllValues;
    export type Bool = CSBoolean;
    export type String = CSString;
    export type Number = CSNumber;
    export type Object = CSObject;
    export type Array = CSArray;
    export type UserFunction = CSUserFunction;
    export type Function = CSFunction;
    export type Interface = CSInterface;
    export type ArrayLike = CSArrayInternalItems;
    export type CallbackParams = ArrayLike;
    export type ObjectPropertys = CSObjectPropertys;
}