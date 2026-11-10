'use client';

import { Controller, useForm, type FieldValues } from 'react-hook-form';
import { Input, Select, Textarea } from './ui';

export type EntityFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'time'
  | 'number'
  | 'password'
  | 'textarea'
  | 'select'
  | 'checkboxes'
  | 'color';

export interface EntityOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface EntityField {
  name: string;
  label: string;
  type?: EntityFieldType;
  options?: EntityOption[];
  placeholder?: string;
  hint?: string;
  span2?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  section?: string;
  required?: boolean;
  visible?: (values: FieldValues) => boolean;
}

export function FieldControl({
  field,
  control,
  invalid,
}: {
  field: EntityField;
  control: ReturnType<typeof useForm<FieldValues>>['control'];
  invalid: boolean;
}) {
  const type = field.type ?? 'text';

  if (type === 'checkboxes') {
    return (
      <Controller
        control={control}
        name={field.name}
        render={({ field: controlled }) => {
          const selected = Array.isArray(controlled.value) ? (controlled.value as string[]) : [];
          const options = field.options ?? [];
          if (options.length === 0) {
            return <span className="field-hint">No hay opciones disponibles.</span>;
          }
          return (
            <div className="person-options" role="group" aria-label={field.label}>
              {options.map((option) => (
                <label className="check" key={option.value}>
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={selected.includes(option.value)}
                    disabled={option.disabled}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((item) => item !== option.value);
                      controlled.onChange(next);
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          );
        }}
      />
    );
  }

  if (type === 'select') {
    return (
      <Controller
        control={control}
        name={field.name}
        render={({ field: controlled }) => (
          <Select
            {...controlled}
            value={controlled.value ?? ''}
            aria-invalid={invalid}
            disabled={field.options?.every((option) => option.disabled)}
          >
            <option value="">{field.placeholder ?? 'Seleccionar…'}</option>
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      />
    );
  }

  if (type === 'color') {
    return (
      <Controller
        control={control}
        name={field.name}
        render={({ field: controlled }) => (
          <div className="row gap-8">
            <input
              className="color-input"
              type="color"
              value={
                typeof controlled.value === 'string' && controlled.value
                  ? controlled.value
                  : '#1F5297'
              }
              onChange={(event) => controlled.onChange(event.target.value.toUpperCase())}
              aria-label={field.label}
            />
            <span className="tiny muted tabular">
              {typeof controlled.value === 'string' ? controlled.value.toUpperCase() : ''}
            </span>
          </div>
        )}
      />
    );
  }

  if (type === 'textarea') {
    return (
      <Controller
        control={control}
        name={field.name}
        render={({ field: controlled }) => (
          <Textarea
            {...controlled}
            value={controlled.value ?? ''}
            rows={field.rows ?? 3}
            placeholder={field.placeholder}
            aria-invalid={invalid}
          />
        )}
      />
    );
  }

  return (
    <Controller
      control={control}
      name={field.name}
      render={({ field: controlled }) => (
        <Input
          {...controlled}
          value={controlled.value ?? ''}
          type={type}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          aria-invalid={invalid}
        />
      )}
    />
  );
}
