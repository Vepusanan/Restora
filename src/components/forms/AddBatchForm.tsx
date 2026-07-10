import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StyleSheet, View } from 'react-native';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { DateField } from '@components/ui/DateField';
import { SelectField } from '@components/ui/SelectField';
import { InlineError } from '@components/ui/InlineError';
import { INVENTORY_UNITS } from '@constants/inventory';
import { toDateOnlyString } from '@utils/expiry';
import {
  createBatchSchema,
  editBatchSchema,
  type CreateBatchFormValues,
  type EditBatchFormValues,
} from '@utils/validators';
import { spacing } from '@constants/theme';
import type { InventoryBatch, InventoryUnit } from '@/types';

type CreateProps = {
  mode: 'create';
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: CreateBatchFormValues) => Promise<void>;
};

type EditProps = {
  mode: 'edit';
  batch: InventoryBatch;
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: EditBatchFormValues) => Promise<void>;
};

type Props = CreateProps | EditProps;

const unitOptions = INVENTORY_UNITS.map((unit) => ({ value: unit, label: unit }));

export function BatchForm(props: Props) {
  if (props.mode === 'create') {
    return <CreateBatchForm {...props} />;
  }
  return <EditBatchForm {...props} />;
}

function CreateBatchForm({ submitting, error, onSubmit }: CreateProps) {
  const today = toDateOnlyString(new Date());
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBatchFormValues>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      ingredientName: '',
      quantity: 1,
      unit: 'kg',
      unitCost: 0,
      supplier: '',
      dateReceived: today,
      expiryDate: today,
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    reset({
      ingredientName: '',
      quantity: 1,
      unit: 'kg',
      unitCost: 0,
      supplier: '',
      dateReceived: toDateOnlyString(new Date()),
      expiryDate: toDateOnlyString(new Date()),
    });
  });

  return (
    <View style={styles.form}>
      <InlineError message={error || undefined} />

      <Controller
        control={control}
        name="ingredientName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Ingredient name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            error={errors.ingredientName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="quantity"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Quantity"
            value={value === undefined || value === null ? '' : String(value)}
            onChangeText={(text) => onChange(text === '' ? Number.NaN : Number(text))}
            onBlur={onBlur}
            keyboardType="decimal-pad"
            error={errors.quantity?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="unit"
        render={({ field: { onChange, value } }) => (
          <SelectField<InventoryUnit>
            label="Unit of measure"
            value={value}
            options={unitOptions}
            onChange={onChange}
            error={errors.unit?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="unitCost"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Unit cost"
            value={value === undefined || value === null ? '' : String(value)}
            onChangeText={(text) => onChange(text === '' ? Number.NaN : Number(text))}
            onBlur={onBlur}
            keyboardType="decimal-pad"
            error={errors.unitCost?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="supplier"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Supplier"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            error={errors.supplier?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="dateReceived"
        render={({ field: { onChange, value } }) => (
          <DateField
            label="Date received"
            value={value}
            onChange={onChange}
            error={errors.dateReceived?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="expiryDate"
        render={({ field: { onChange, value } }) => (
          <DateField
            label="Expiry date"
            value={value}
            onChange={onChange}
            error={errors.expiryDate?.message}
          />
        )}
      />

      <Button title="Create batch" onPress={submit} loading={submitting} />
    </View>
  );
}

function EditBatchForm({ batch, submitting, error, onSubmit }: EditProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditBatchFormValues>({
    resolver: zodResolver(editBatchSchema),
    defaultValues: {
      supplier: batch.supplier,
      quantity: batch.quantity,
      dateReceived: batch.dateReceived,
      expiryDate: batch.expiryDate,
    },
  });

  return (
    <View style={styles.form}>
      <InlineError message={error || undefined} />

      <Controller
        control={control}
        name="supplier"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Supplier"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            error={errors.supplier?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="quantity"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Quantity"
            value={value === undefined || value === null ? '' : String(value)}
            onChangeText={(text) => onChange(text === '' ? Number.NaN : Number(text))}
            onBlur={onBlur}
            keyboardType="decimal-pad"
            error={errors.quantity?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="expiryDate"
        render={({ field: { onChange, value } }) => (
          <DateField
            label="Expiry date"
            value={value}
            onChange={onChange}
            error={errors.expiryDate?.message}
            minimumDate={parseSafe(batch.dateReceived)}
          />
        )}
      />

      <Button title="Save changes" onPress={handleSubmit(onSubmit)} loading={submitting} />
    </View>
  );
}

function parseSafe(value: string): Date | undefined {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.xs,
    paddingBottom: spacing.xl,
  },
});
