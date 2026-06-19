import { type Producer } from "@ouestware/atoms";
import { clamp, isNil, mapValues, omit } from "lodash";

import { type ItemType, type Scalar } from "../types";
import { type FieldModel, type GraphDataset, type ItemData } from "./types";

export const setFieldModel: Producer<GraphDataset, [FieldModel, Record<string, Scalar>?]> = (
  fieldModel,
  itemValues,
) => {
  const fieldsKey = fieldModel.itemType === "nodes" ? "nodeFields" : "edgeFields";
  const dataKey = fieldModel.itemType === "nodes" ? "nodeData" : "edgeData";
  return (state) => {
    const prevFieldsKey = state[fieldsKey];
    const shouldUpdateFields = !!prevFieldsKey.find((field) => field.id === fieldModel.id);
    const newState = {
      ...state,
      [fieldsKey]: shouldUpdateFields
        ? prevFieldsKey.map((field) => (field.id === fieldModel.id ? fieldModel : field))
        : [...prevFieldsKey, fieldModel],
    };

    if (itemValues)
      newState[dataKey] = mapValues(newState[dataKey], (data, itemId) => ({
        ...data,
        [fieldModel.id]: itemValues[itemId] ?? data[fieldModel.id],
      }));

    return newState;
  };
};

export const moveFieldModel: Producer<GraphDataset, [ItemType, string, number]> = (
  type: ItemType,
  id: string,
  offset: number,
) => {
  return (state) => {
    const key = type === "nodes" ? "nodeFields" : "edgeFields";
    const newFields: FieldModel[] = state[key].slice(0);
    const currentIndex = newFields.findIndex((field) => field.id === id);
    if (currentIndex === -1) return state;

    const newIndex = clamp(currentIndex + offset, 0, newFields.length - 1);
    const [field] = newFields.splice(currentIndex, 1);
    newFields.splice(newIndex, 0, field);

    return {
      ...state,
      [key]: newFields,
    };
  };
};

export const createFieldModel: Producer<GraphDataset, [FieldModel, { index?: number; values?: ItemData }?]> = (
  fieldModel,
  { index, values } = {},
) => {
  return (state) => {
    const dataKey = fieldModel.itemType === "nodes" ? "nodeData" : "edgeData";
    const fieldsKey = fieldModel.itemType === "nodes" ? "nodeFields" : "edgeFields";
    const newFields: FieldModel[] = state[fieldsKey].slice(0);
    const newIndex = index !== undefined ? clamp(index, 0, newFields.length) : newFields.length;

    newFields.splice(newIndex, 0, fieldModel);
    return {
      ...state,
      [fieldsKey]: newFields,
      [dataKey]: values
        ? mapValues(state[dataKey], (data, itemId) => ({
            ...data,
            [fieldModel.id]: values[itemId] || data[fieldModel.id],
          }))
        : state[dataKey],
    };
  };
};

export const deleteFieldModel: Producer<GraphDataset, [FieldModel]> = (fieldModel) => {
  return (state) => {
    const type = fieldModel.itemType;
    const dataKey = type === "nodes" ? "nodeData" : "edgeData";
    const fieldsKey = type === "nodes" ? "nodeFields" : "edgeFields";
    const newFields: FieldModel[] = state[fieldsKey].filter((field) => field.id !== fieldModel.id);

    return {
      ...state,
      [fieldsKey]: newFields,
      [dataKey]: mapValues(state[dataKey], (data) => omit(data, fieldModel.id)),
    };
  };
};

export const duplicateFieldModel: Producer<GraphDataset, [FieldModel, string?, number?]> = (
  fieldModel,
  id,
  index,
) => {
  const type = fieldModel.itemType;
  if (fieldModel.id === id)
    throw new Error(`The new ${type} field model id must be different from the existing one "${id}"`);

  return (state) => {
    const dataKey = type === "nodes" ? "nodeData" : "edgeData";
    const fieldsKey = type === "nodes" ? "nodeFields" : "edgeFields";
    const fields = new Set(state[fieldsKey].map((field) => field.id));
    if (isNil(id)) {
      let i = 1;
      let newId = `${fieldModel.id} (${i})`;
      while (fields.has(newId)) {
        i++;
        newId = `${fieldModel.id} (${i})`;
      }
      id = newId;
    }

    const newFieldModel = {
      ...fieldModel,
      id,
    };
    const newFields: FieldModel[] = state[fieldsKey].slice(0);
    if (fields.has(id)) throw new Error(`A ${type} field model with id "${id}" already exists`);

    const newIndex = clamp(
      index ?? newFields.findIndex((field) => field.id === fieldModel.id) + 1,
      0,
      newFields.length - 1,
    );
    newFields.splice(newIndex, 0, newFieldModel);
    return {
      ...state,
      [fieldsKey]: newFields,
      [dataKey]: mapValues(state[dataKey], (data) => ({ ...data, [id!]: data[fieldModel.id] })),
    };
  };
};
