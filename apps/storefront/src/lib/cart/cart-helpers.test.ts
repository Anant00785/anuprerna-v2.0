import { describe, expect, it } from 'vitest';
import {
  calculateAvailableStock,
  calculateMOQ,
  getIncrementStep,
  validateAndClampQuantity,
} from './cart-helpers';

describe('cart-helpers stock & MOQ validation', () => {
  it('calculates available stock for in-stock fabric product', () => {
    const stock = calculateAvailableStock({
      totalQuantity: 9,
      productGroup: 'fabric',
      orderType: 'IN_STOCK',
    });
    expect(stock).toBe(9);
  });

  it('clamps requested quantity when exceeding available stock (e.g. ordered 10 when stock is 9)', () => {
    const result = validateAndClampQuantity(10, {
      totalQuantity: 9,
      productGroup: 'fabric',
      orderType: 'IN_STOCK',
      unit: 'METER',
    });

    expect(result.clampedQuantity).toBe(9);
    expect(result.exceededMaxStock).toBe(true);
    expect(result.warningMessage).toContain('Maximum available stock reached');
  });

  it('enforces 0.5 meter increment step for fabrics', () => {
    expect(getIncrementStep('METER', 'fabric')).toBe(0.5);
    expect(getIncrementStep('UNIT', 'swatch')).toBe(1);

    const result = validateAndClampQuantity(2.3, {
      totalQuantity: 50,
      productGroup: 'fabric',
      orderType: 'IN_STOCK',
      unit: 'METER',
    });
    // 2.3 rounded to nearest 0.5 step is 2.5
    expect(result.clampedQuantity).toBe(2.5);
  });

  it('enforces MOQ for Pre-Order products', () => {
    const moq = calculateMOQ({
      productGroup: 'fabric',
      orderType: 'PRE_ORDER',
    });
    expect(moq).toBe(50);

    const result = validateAndClampQuantity(5, {
      productGroup: 'fabric',
      orderType: 'PRE_ORDER',
      unit: 'METER',
    });
    expect(result.clampedQuantity).toBe(50);
    expect(result.exceededMinMOQ).toBe(true);
  });

  it('returns 0.5 meter MOQ for IN_STOCK items even when minOrderQuantity is attached to params', () => {
    const moq = calculateMOQ({
      productGroup: 'fabric',
      orderType: 'IN_STOCK',
      unit: 'METER',
      minOrderQuantity: 25,
    });
    expect(moq).toBe(0.5);
  });
});
