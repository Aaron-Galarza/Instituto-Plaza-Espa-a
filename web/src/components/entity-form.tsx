'use client';

import { Fragment, useEffect, useId, type ReactNode } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodTypeAny } from 'zod';
import { Button, ErrorBox, Field, Modal } from './ui';

import { FieldControl, type EntityField } from './entity-field';
export type { EntityField, EntityFieldType, EntityOption } from './entity-field';

function messageFor(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  if (Array.isArray(error)) {
    for (const item of error) {
      const message = messageFor(item);
      if (message) return message;
    }
  }
  return undefined;
}

/**
 * Formulario modal reutilizable para altas y ediciones simples.
 * La validación se resuelve con Zod antes de invocar `onSubmit`.
 */
export function EntityFormModal({
  open,
  onClose,
  title,
  description,
  schema,
  defaultValues,
  fields,
  submitLabel = 'Guardar',
  onSubmit,
  busy = false,
  error,
  size = 'default',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  schema: ZodTypeAny;
  defaultValues: FieldValues;
  fields: EntityField[];
  submitLabel?: string;
  onSubmit: (values: FieldValues) => void | Promise<void>;
  busy?: boolean;
  error?: string;
  size?: 'small' | 'default' | 'wide';
  children?: ReactNode;
}) {
  const formId = useId();
  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });
  const serialized = JSON.stringify(defaultValues);

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, serialized]);

  const values = form.watch();
  const visibleFields = fields.filter((field) => !field.visible || field.visible(values));

  let currentSection: string | undefined;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="primary" disabled={busy}>
            {busy ? 'Guardando…' : submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={form.handleSubmit((submitted) => onSubmit(submitted))}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 13 }}
      >
        {error ? <ErrorBox message={error} /> : null}
        <div className="form-grid">
          {visibleFields.map((field) => {
            const section = field.section;
            const showSection = Boolean(section && section !== currentSection);
            if (section) currentSection = section;
            const error = messageFor(form.formState.errors[field.name]);
            const span2 = field.span2 || field.type === 'checkboxes' || field.type === 'textarea';
            return (
              <Fragment key={field.name}>
                {showSection ? (
                  <div className="form-section span-2">
                    <h3>{section}</h3>
                  </div>
                ) : null}
                <Field
                  label={field.required ? `${field.label} *` : field.label}
                  error={error}
                  hint={field.hint}
                  className={span2 ? 'span-2' : ''}
                >
                  <FieldControl field={field} control={form.control} invalid={Boolean(error)} />
                </Field>
              </Fragment>
            );
          })}
        </div>
        {children}
      </form>
    </Modal>
  );
}
