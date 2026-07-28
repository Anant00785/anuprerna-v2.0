"use client";

interface ProcessItem {
  title: string;
  subtitleBreak?: boolean;
  titleEnd?: string;
  description: string;
  image: string;
  link: string;
}

const PROCESS_ITEMS: ProcessItem[] = [
  {
    title: "Order Fabric Swatches",
    description:
      "We offer fabric swatches for you to explore. Receive samples of our exquisite handloom fabrics to assess their texture, colour, and quality.",
    image:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/swatch-bundle-min.jpg",
    link: "https://anuprerna.com/content/wholesale/order-fabric-swatches/59195",
  },
  {
    title: "Bulk Orders & Customisations",
    description:
      "Planning ahead? Our preorder service is crafted for bulk orders, ensuring timely delivery and optimal stock levels for large-scale orders.",
    image:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/bulk-order.png",
    link: "https://anuprerna.com/content/wholesale/wholesale-production-preorder/59335",
  },
  {
    title: "100% Natural Custom",
    subtitleBreak: true,
    titleEnd: "Dyeing",
    description:
      "We offer natural and sustainable custom dyeing options that allow you to create the perfect shade for your fabrics and apparel.",
    image:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/custom-dyeing.png",
    link: "https://anuprerna.com/content/wholesale/natural-sustainable-custom-dyeing/59105",
  },
  {
    title: "Custom Clothing &",
    subtitleBreak: true,
    titleEnd: "Accessories",
    description:
      "We specialise in customised designs for clothing, accessories, and homewares, crafted meticulously to fit your requirements.",
    image:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/customisations.png",
    link: "https://anuprerna.com/content/wholesale/custom-clothing-accessories-homewares/703160",
  },
];

export function ManufacturingProcess() {
  return (
    <section className="w-full flex flex-col justify-center items-center bg-[#F0EEE9] py-10 mt-8 lg:mt-0">
      <h2 className="text-2xl sm:text-4xl text-black font-medium mb-5 md:mb-10 text-center px-3">
        <a
          href="https://anuprerna.com/content/wholesale/custom-clothing-accessories-homewares/703160"
          target="_blank"
          rel="noreferrer"
          className="text-[#7D5B20] hover:underline"
        >
          End to End
        </a>{" "}
        Manufacturing Process
      </h2>

      <div className="container w-full px-8 mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10 xl:gap-3 content-center">
        {PROCESS_ITEMS.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="relative flex w-full xl:max-w-[320px] flex-col rounded-xl bg-gradient-to-br from-white to-gray-50 bg-clip-border text-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="relative mx-4 -mt-6 h-44 overflow-hidden rounded-xl bg-clip-border shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4 flex-1">
              <h3 className="mb-2 block text-base md:text-lg font-semibold leading-snug tracking-normal text-gray-900 antialiased group-hover:text-[#7D5B20] transition-colors duration-300">
                {item.title}{" "}
                {item.subtitleBreak && (
                  <>
                    <br className="hidden 2xl:block" />
                    {item.titleEnd}
                  </>
                )}
              </h3>
              <p className="block text-sm font-light leading-relaxed text-gray-700 antialiased">
                {item.description}
              </p>
            </div>
            <div className="p-4 pt-0">
              <button className="group/btn relative w-full inline-flex items-center justify-center px-4 py-2 font-bold text-white rounded-lg bg-gradient-to-r from-[#9C8A6C] to-[#B7A98F] hover:from-[#8c7961] hover:to-[#9C8A6C] shadow-lg shadow-[#B7A98F]/30 hover:shadow-[#B7A98F]/40 transition-all duration-300 hover:-translate-y-0.5">
                <span className="relative flex items-center gap-2 text-sm">
                  Read More
                  <svg
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    fill="none"
                    className="w-5 h-5 transform transition-transform group-hover/btn:translate-x-1"
                  >
                    <path
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    ></path>
                  </svg>
                </span>
              </button>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
