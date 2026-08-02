export type TValue = string | number | boolean | object;

export interface IKeyValue {
  key: string;
  value: TValue;
  disabled: boolean;
}

export type TKeyValueList = IKeyValue[];
