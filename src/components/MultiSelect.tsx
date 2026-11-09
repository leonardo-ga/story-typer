import { SelectMenu, type SelectOption } from './SelectMenu';

interface Props<Value extends string> {
  label: string;
  options: readonly SelectOption<Value>[];
  value: readonly Value[];
  onChange: (value: Value[]) => void;
}
export function MultiSelect<Value extends string>(props: Props<Value>) {
  return <SelectMenu {...props} multiple />;
}
