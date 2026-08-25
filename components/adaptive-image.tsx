/* eslint-disable @next/next/no-img-element */
import Image from'next/image';
type Props={src:string;alt:string;fill?:boolean;width?:number;height?:number;sizes?:string;priority?:boolean;className?:string};
const trusted=(src:string)=>src.startsWith('/');
export function AdaptiveImage({src,alt,fill,width,height,sizes,priority,className}:Props){const safe=src||'/giftmitra-hero.png';if(trusted(safe))return <Image src={safe} alt={alt} fill={fill} width={fill?undefined:width??900} height={fill?undefined:height??900} sizes={sizes} priority={priority} className={className}/>;return <img src={safe} alt={alt} width={fill?undefined:width??900} height={fill?undefined:height??900} loading={priority?'eager':'lazy'} className={`adaptive-native-image${className?` ${className}`:''}`} style={fill?{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}:{width:'100%',height:'auto'}}/>}
