export default function WhyPartner() {
  const cards = [
    {
      num: '01',
      label: 'SAMPLING',
      title: 'Order Fabric Swatches',
      desc: 'We offer fabric swatches for you to explore. Receive samples of our exquisite handloom fabrics to assess their texture, colour, and quality.',
      bg: 'bg-[#F9F4F5]',
      href: '/content/wholesale/order-fabric-swatches/59195',
    },
    {
      num: '02',
      label: 'BULK & CUSTOM',
      title: 'Bulk Orders & Customisations',
      desc: 'Planning ahead? Our preorder service is crafted for bulk orders, ensuring timely delivery and optimal stock levels for large-scale orders.',
      bg: 'bg-[#E9F1ED]',
      href: '/content/wholesale/wholesale-production-preorder/59335',
    },
    {
      num: '03',
      label: 'DYEING',
      title: '100% Natural Custom Dyeing',
      desc: 'We offer natural and sustainable custom dyeing options that allow you to create the perfect shade for your fabrics and apparel.',
      bg: 'bg-[#EBE9F2]',
      href: '/content/wholesale/natural-sustainable-custom-dyeing/59105',
    },
    {
      num: '04',
      label: 'DESIGN & PRODUCTION',
      title: 'Custom Clothing & Accessories',
      desc: 'We specialise in customised designs for clothing, accessories, and homewares, crafted meticulously to fit your requirements.',
      bg: 'bg-[#EAEBF1]',
      href: '/content/wholesale/custom-clothing-accessories-homewares/703160',
    },
  ];

  return (
    <section id="process" className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar label */}
          <div className="flex-shrink-0 flex md:flex-col items-center md:items-start">
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 md:[writing-mode:vertical-rl] md:rotate-180"
              aria-label="Why Partner with Anuprerna"
            >
              WHY PARTNER WITH ANUPRERNA
            </span>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Precision in every
              <br />
              <span className="italic">thread</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cards.map((card) => (
                <a
                  key={card.num}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${card.bg} rounded-2xl p-6 flex flex-col gap-3 hover:shadow-md transition-shadow group`}
                >
                  <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                    {card.num} / {card.label}
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-gray-900 group-hover:text-clay transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm font-light leading-relaxed text-gray-600">
                    {card.desc}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
