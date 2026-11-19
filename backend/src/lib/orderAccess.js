// Server-side order ownership rule: a customer may read an order only if it belongs to them.
// Orders with no owner (placed before sign-in existed) are readable by no customer.
export function canViewOrder(order, customerId) {
  if (!order || order.customerId === null || order.customerId === undefined) return false;
  return order.customerId === customerId;
}
