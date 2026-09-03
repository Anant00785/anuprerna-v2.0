import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });
const q = [
  ['cart by tenant', sql`explain (analyze) select * from cart_item where tenant_id = 101148197`],
  ['order items', sql`explain (analyze) select * from order_item where order_id = 1000`],
  ['fabric by prod', sql`explain (analyze) select * from product_fabric where product_id = 127682`],
  ['prod by subcat', sql`explain (analyze) select count(*) from product where sub_category_id = 10`],
];
for (const [name, p] of q) {
  const txt = (await p).map((r) => r['QUERY PLAN']).join('\n');
  const scan = /Seq Scan/.test(txt) ? 'SEQ SCAN' : /Index/.test(txt) ? 'index' : '?';
  const time = (txt.match(/Execution Time: ([\d.]+) ms/) || [])[1];
  console.log(`${name.padEnd(16)} ${scan.padEnd(9)} ${String(time).padStart(9)} ms`);
}
await sql.end();
