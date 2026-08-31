import Link from 'next/link';
import Image from 'next/image';
import Carousel from './Carousel';
const S = '/media/'; // rewritten to the sandbox media route (was live bloomscorp S3)
const N = S + 'home/news/';
const ITEMS = [
  { href:'https://meaningful.business/team/amit-singha/', news:N+'mb-100-news.png', logo:S+'m-business.png', src:'2024 Meaningful Business 100', art:'Chosen for our commitment of using business as a force for good—combining purpose and profit to tackle social and environmental challenges' },
  { href:'https://acumen.org/blog/anuprerna-creates-equitable-green-jobs-for-underserved-artisans-in-india/', news:N+'acumen-news.png', logo:S+'acumen.png', src:'Acumen', art:'Anuprerna creates equitable green jobs for underserved artisans in India' },
  { href:'https://60decibels.com/insights/india-artisans-anuprerna/', news:N+'60db-press.png', logo:S+'60db.png', src:'60 decibels', art:'Empowering India’s Artisans: Anuprerna’s Journey to Impactful, Sustainable Craftsmanship' },
  { href:'https://www.buildanest.org/preserving-indias-khadi-tradition-with-anuprerna/', news:N+'nest-news.jpg', logo:S+'nest.png', src:'Nest', art:'Preserving India’s Khadi Tradition with Guild Member, Anuprerna' },
  { href:'https://craftatlas.co/artisans/anuprerna-artisanal-heritage-textiles-of-bengal', news:N+'craft-news.png', logo:S+'the_craft_atlas.png', src:'The Craft Atlas', art:'Anuprerna - Artisanal heritage textiles of Bengal' },
  { href:'https://www.etsy.com/in-en/shop/Anuprerna/reviews?ref=shop_info', news:N+'etsy-news.png', logo:S+'etsy.png', src:'Etsy Speaks', art:'Anuprerna - East India Handwoven Natural Ethical Textile & Crafts' },
  { href:'https://www.thetextileatlas.com/craft-stories/jamdani-weaving', news:N+'textile-news.jpg', logo:S+'the_textail_atlas.png', src:'The Textile Atlas', art:'Anuprerna, creating Jamdani fabrics in 4 clusters at the Burdwan district in West Bengal, India.' },
  { href:'https://in.fashionnetwork.com/news/Anuprerna-launches-e-commerce-platform-eyes-international-handloom-trade,1222271.html', news:N+'fashion-network-news.jpg', logo:S+'fashion_network.png', src:'Fashion Network', art:'Anuprerna launches e-commerce platform, eyes international handloom trade' },
  { href:'https://www.paypal.com/IN/webapps/mpp/supportlocal#', news:N+'paypal-news.jpg', logo:S+'paypal.png', src:'Paypal', art:'Championing slow fashion before it was fashionable' },
  { href:'https://lbb.in/kolkata/anuprerna-fabrics-scarves-sarees/', news:N+'lbb-news.jpg', logo:S+'lbb.png', src:'LBB', art:'Shop For Handwoven Fabrics, Scarves And Sarees From This Bengal-Based Brand' },
  { href:'https://www.youtube.com/watch?v=zCz3Z-t7q9E', news:N+'ndtv-news.jpg', logo:S+'ndtv.png', src:'NDTV', art:'Sustainable, Upcycled And Repurposed - Meet the masters of their craft' },
  { href:'https://www.fibre2fashion.com/interviews/face2face/anuprerna/amit-singha/12581-1/', news:N+'fibre-news.jpg', logo:S+'fibre_fashion.png', src:'Fibre2Fashion', art:'Interview With Amit Singha, Founder of Anuprerna' },
];
export default function News() {
  return (
    <section className='fb-third-party w-full flex flex-col justify-center items-center py-10 bg-[#fffcf7]'>
      <div className='w-full container mx-auto max-w-screen-xl px-4 lg:px-12'>
        <div className='flex items-center justify-between mb-8'>
          <h2 className='text-3xl sm:text-5xl text-[#7D5B20] font-medium'>We are in the <span className='text-black'>news</span></h2>
          <Link href='/blogs' className='fb-view-all'>
            View all <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
          </Link>
        </div>
        <Carousel ariaLabel='Press coverage'>
          {ITEMS.map(it => (
            <a key={it.src} href={it.href} target='_blank' rel='noopener'
               className='shrink-0 w-[80%] sm:w-[45%] lg:w-[calc((100%-3rem)/4)] flex flex-col justify-between items-start p-3 rounded-md hover:shadow-lg relative min-h-[280px] transition-shadow'>
              <div className='relative w-full h-[200px] mb-2'>
                <Image src={it.news} alt={it.art} fill sizes='320px' className='object-cover rounded' />
              </div>
              <div className='w-full flex flex-col justify-start items-start text-start'>
                <div className='w-full flex justify-between items-center flex-row-reverse mt-3 mb-4'>
                  <img src={it.logo} alt={it.src} style={{maxWidth:'40px',objectFit:'contain'}} />
                  <p className='text-[#6c5b48] font-semibold text-lg lg:text-xl'>{it.src}</p>
                </div>
                <article className='text-[#7D5B20] text-xs sm:text-sm'>{it.art}</article>
              </div>
            </a>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
