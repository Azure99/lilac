import type {ConceptScoreSignal, DataType, Signal, SignalInputType} from '../fastapi_client';
export type LeafValue = number | boolean | string | null;
export type FieldValue = FieldValue[] | {[fieldName: string]: FieldValue} | LeafValue;

export interface Item {
  [column: string]: FieldValue;
}

export interface ImageInfo {
  path: Path;
}

export type Path = Array<string>;

export const PATH_WILDCARD = '*';
export const UUID_COLUMN = '__rowid__';
export const VALUE_KEY = '__value__';

export const SIGNAL_INPUT_TYPE_TO_VALID_DTYPES: Record<SignalInputType, DataType[]> = {
  text: ['string', 'string_span'],
  text_embedding: ['embedding'],
  image: ['binary']
};

export type DataTypeNumber =
  | 'int8'
  | 'int16'
  | 'int32'
  | 'int64'
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'uint64'
  | 'float16'
  | 'float32'
  | 'float64';

export type DataTypeCasted<D extends DataType = DataType> =
  | (D extends 'string'
      ? string
      : D extends 'boolean'
      ? boolean
      : D extends DataTypeNumber
      ? number
      : D extends 'string_span'
      ? {start: number; end: number}
      : D extends 'time' | 'date' | 'timestamp' | 'interval' | 'binary'
      ? string
      : D extends 'struct'
      ? object
      : D extends 'list'
      ? unknown[]
      : never)
  | null;

export function isFloat(dtype: DataType | undefined): dtype is 'float16' | 'float32' | 'float64' {
  return ['float16', 'float32', 'float64'].indexOf(dtype ?? '') >= 0;
}

export function isInteger(
  dtype: DataType
): dtype is 'int8' | 'int16' | 'int32' | 'int64' | 'uint8' | 'uint16' | 'uint32' | 'uint64' {
  return (
    ['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64'].indexOf(dtype) >= 0
  );
}

export function isTemporal(dtype: DataType) {
  return ['time', 'date', 'timestamp', 'interval'].indexOf(dtype) >= 0;
}

export function isOrdinal(dtype: DataType) {
  return isFloat(dtype) || isInteger(dtype) || isTemporal(dtype);
}

export function serializePath(path: Path): string {
  return path.map(p => `"${p}"`).join('.');
}

export function deserializePath(path: string | Path): Path {
  if (Array.isArray(path)) return path;
  const matches = path.match(/("[^"]+"|[\w*]+)/g)?.map(match => match.replace(/"/g, ''));
  return matches || [];
}
export function pathIsEqual(
  path1: Path | string | undefined,
  path2: Path | string | undefined
): boolean {
  if (!path1 || !path2) return false;
  path1 = deserializePath(path1);
  path2 = deserializePath(path2);
  if (path1.length !== path2.length) return false;
  for (let i = 0; i < path1.length; i++) {
    if (path1[i] !== path2[i]) return false;
  }
  return true;
}

export function pathIncludes(
  path1: Path | string | undefined,
  path2: Path | string | undefined
): boolean {
  if (!path1 || !path2) return false;
  path1 = deserializePath(path1);
  path2 = deserializePath(path2);
  if (path1.length < path2.length) return false;
  return pathIsEqual(path1.slice(0, path2.length), path2);
}

/**
 * Returns true if path2 matches the pattern of path1
 * @param path1 Path that may contain wildcard pattern
 * @param path2 Path to match against path1
 */
export function pathIsMatching(path1: Path | string | undefined, path2: Path | string | undefined) {
  if (!path1 || !path2) return false;
  path1 = deserializePath(path1);
  path2 = deserializePath(path2);
  if (path1.length !== path2.length) return false;
  for (let i = 0; i < path1.length; i++) {
    if (path1[i] === path2[i]) continue;
    if (path1[i] !== path2[i] && path1[i] !== PATH_WILDCARD) return false;
    if (path1[i] === PATH_WILDCARD) {
      if (!path2[i].match(/^\d+$/)) return false;
    }
  }
  return true;
}
export function isConceptScoreSignal(
  signal: ConceptScoreSignal | Signal | undefined
): signal is ConceptScoreSignal {
  return (signal as ConceptScoreSignal)?.concept_name != undefined;
}

export function formatValue(value: DataTypeCasted) {
  if (value == null) {
    return 'N/A';
  }
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, {maximumFractionDigits: 3});
  }
  return value.toString();
}