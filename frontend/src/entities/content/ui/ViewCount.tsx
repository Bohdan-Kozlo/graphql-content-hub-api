export function ViewCount({ count }: { count: number }) {
  return <span>{`${count.toLocaleString('en')} ${count === 1 ? 'view' : 'views'}`}</span>
}
