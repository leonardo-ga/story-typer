import type { RefObject } from 'react';
import { SelectMenu, type SelectOption } from './SelectMenu';

interface Props<Value extends string> {
  label: string;
  options: readonly SelectOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  triggerRef?: RefObject<HTMLButtonElement>;
}
export function SingleSelect<Value extends string>({
  value,
  onChange,
  ...props
}: Props<Value>) {
  return (
    <SelectMenu
      {...props}
      multiple={false}
      searchable={props.options.length > 8}
      value={[value]}
      onChange={(values) => {
        if (values[0] !== undefined) onChange(values[0]);
      }}
    />
  );
}
