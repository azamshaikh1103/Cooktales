// "use client";
// import Image from "next/image";
// import BasicCard from "./BasicCard";
// import Footer from "./Footer";
// import imageLoader from "@/lib/loader";
// import { raleway } from "../lib/fonts";
// import { FaStar } from "react-icons/fa";
// import { useState } from "react";
// import { redirect } from "next/navigation";
// import { useParams } from "next/navigation";

// const RecipePromotion = () => {
//   const RecipeCategories = [
//     "Breakfast",
//     "Snacks",
//     "Rice",
//     "Cakes",
//     "Chicken",
//     "Vegetarian",
//     "Non-Vegetarian",
//     "Kids",
//     "Lunch",
//     "Sweets",
//     "Drinks",
//     "Egg",
//     "Seafood",
//     "DIY",
//     "Instant pot",
//     "Millets",
//   ];

//   return (
//     <>
//       <div className=" pt-20 pl-24 flex gap-5 overflow-scroll no-scrollbar">
//         {RecipeCategories.map((category, _i) => (
//           <RecipeCategory
//             categoryTitle={category}
//             key={_i}
//             animate={` animate-fadeIn-${_i * 2}`}
//           />
//         ))}
//       </div>
//       <div className=" animate-fade-in-5 mx-24 my-10 h-52 bg-slate-200 rounded-3xl flex items-center justify-center text-white">
//         Promotion here
//       </div>
//       <PopularDish />
//       {/* <Recipes /> */}
//     </>
//   );
// };

// export default RecipePromotion;

// const RecipeCategory = ({
//   categoryTitle,
//   animate,
// }: {
//   categoryTitle: string;
//   animate: string;
// }) => {
//   const { slug } = useParams();
//   console.log(slug);

//   return (
//     <div
//       onClick={() => redirect(``)}
//       className={`${animate} bg-[#006c5e0e] p-2 rounded-xl`}
//     >
//       <div className=" relative bg-slate-200 w-48 h-32 rounded-xl overflow-hidden">
//         <Image
//           src="https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FHeropage%2FfoodPoster.jpg?alt=media&token=5622b8e7-c992-4ed5-8b55-0451d23fe86e"
//           alt="image"
//           className=" w-full"
//           objectFit="cover"
//           loader={imageLoader}
//           layout="fill"
//         />
//       </div>
//       <div className=" pt-2 font-sans text-sm text-center">{categoryTitle}</div>
//     </div>
//   );
// };

// const PopularDish = () => {
//   const popularDishes = ["", "", "", "", "", "", "", ""];
//   return (
//     <>
//       <div className="my-10 h-auto">
//         <div className={`${raleway.className} pl-20 text-3xl font-bold pb-3`}>
//           Popular recipes
//         </div>
//         <div className=" pl-20 font-sans">Unleash your love with foods</div>

//         <div className=" pl-32 py-10 flex gap-10 overflow-y-scroll no-scrollbar">
//           {popularDishes.map((dish, _i) => (
//             <BasicCard key={_i} animate={`animate-fadeIn-${_i + 8}`} />
//           ))}
//         </div>
//       </div>
//     </>
//   );
// };

// const Recipes = () => {
//   const items = [
//     { id: 1, content: "/samplePic.jpg" },
//     {
//       id: 2,
//       content:
//         "https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FHeropage%2FfoodPoster.jpg?alt=media&token=5622b8e7-c992-4ed5-8b55-0451d23fe86e",
//     },
//     {
//       id: 9,
//       content:
//         "https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FHeropage%2FNo-Fail_Roast_Chicken_With_Lemon_and_Garlic.jpg?alt=media&token=010d631d-f425-409c-8d07-9d312494a3a5",
//     },
//     {
//       id: 3,
//       content:
//         "https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FHeropage%2FfoodPoster.jpg?alt=media&token=5622b8e7-c992-4ed5-8b55-0451d23fe86e",
//     },
//     {
//       id: 4,
//       content:
//         "https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FHeropage%2FfoodPoster.jpg?alt=media&token=5622b8e7-c992-4ed5-8b55-0451d23fe86e",
//     },
//     {
//       id: 5,
//       content:
//         "https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FHeropage%2FNo-Fail_Roast_Chicken_With_Lemon_and_Garlic.jpg?alt=media&token=010d631d-f425-409c-8d07-9d312494a3a5",
//     },
//     {
//       id: 6,
//       content:
//         "https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FHeropage%2FfoodPoster.jpg?alt=media&token=5622b8e7-c992-4ed5-8b55-0451d23fe86e",
//     },
//     { id: 7, content: "/samplePic.jpg" },
//     { id: 12, content: "/samplePic2.jpg" },
//     {
//       id: 8,
//       content:
//         "https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FHeropage%2FfoodPoster.jpg?alt=media&token=5622b8e7-c992-4ed5-8b55-0451d23fe86e",
//     },
//     {
//       id: 10,
//       content:
//         "https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FHeropage%2FfoodPoster.jpg?alt=media&token=5622b8e7-c992-4ed5-8b55-0451d23fe86e",
//     },
//     { id: 11, content: "/samplePic.jpg" },
//   ];

//   return (
//     <>
//       <div className="my-10 h-auto">
//         <div className={`${raleway.className} pl-20 text-3xl font-bold pb-3`}>
//           Indian Cousins
//         </div>
//         <div className=" pl-20 font-sans">Unleash your love with foods</div>

//         <div className=" mx-24 my-10 columns-4 gap-3">
//           {items.map((item) => (
//             <RecipeMansoryCard
//               key={item.id}
//               id={item.id}
//               content={item.content}
//             />
//           ))}

//           {/* Layout end */}
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// {
//   /* This need to be hidden */
// }
// <div className=" px-5 w-full text-white">
//   <div className={`${raleway.className} font-bold text-2xl`}>
//     Chicken Hakka Noodles
//   </div>
//   <div className=" font-sans px-1 text-sm ">
//     <div>Total time req: 1 hour 24 mins</div>
//     <div>Yield: 43XY</div>
//     <div>Diet: Vegetarian</div>
//   </div>

//   <div className=" w-full flex justify-between items-center py-4">
//     <div className="flex gap-2">
//       <Image
//         src="https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FProfile%2FprofilePicture%2FprofileDP.png?alt=media&token=5d2fa48f-eb2d-4644-800d-e6f12518d85a"
//         width={40}
//         height={20}
//         alt="Profile_DP"
//         loader={imageLoader}
//       />
//       <div>
//         <div className=" font-sans h-5">Andrew Wilson</div>
//         <div className=" font-sans font-light text-xs">699 followers</div>
//       </div>
//     </div>
//     <div className="text-white flex items-center justify-center gap-2 bg-[#006C5E] px-5 py-1 rounded-full">
//       <FaStar />
//       <span className={`${raleway.className} text-lg font-bold`}>4.7</span>
//     </div>
//   </div>
// </div>;

// const RecipeMansoryCard = ({
//   id,
//   content,
// }: {
//   id: number;
//   content: string;
// }) => {
//   const [showDetails, setShowDetails] = useState(false);
//   return (
//     <div
//       key={id}
//       onMouseOver={() => setShowDetails(true)}
//       onMouseLeave={() => setShowDetails(false)}
//       className=" h-fit break-inside-avoid mb-3 bg-[#006C5E] rounded-3xl shadow-xl cursor-pointer relative overflow-hidden flex"
//     >
//       <Image
//         src={content}
//         alt="image"
//         width={1000}
//         height={1000}
//         className=" w-full"
//       />
//       {/* content start */}
//       <div className=" bottom-0 absolute z-10 px-5 w-full text-white bg-linear-to-b from-transparent to-black rounded-b-3xl">
//         <div
//           className={`${raleway.className} font-bold ${
//             showDetails
//               ? " animate-move-up text-2xl"
//               : " py-2 text-xl text-center"
//           } text-2xl`}
//         >
//           Chicken Hakka Noodles
//         </div>
//         <div
//           className={` ${
//             showDetails ? "animate-move-up" : "hidden"
//           } font-sans px-1 text-sm `}
//         >
//           <div>Total time req: 1 hour 24 mins</div>
//           <div>Yield: 43XY</div>
//           <div>Diet: Vegetarian</div>
//         </div>

//         <div
//           className={` ${
//             showDetails ? "animate-move-up" : "hidden"
//           } w-full flex justify-between items-center py-4`}
//         >
//           <div className="flex gap-2">
//             <Image
//               src="https://firebasestorage.googleapis.com/v0/b/portfolio-app-10e41.appspot.com/o/cooktale%2FProfile%2FprofilePicture%2FprofileDP.png?alt=media&token=5d2fa48f-eb2d-4644-800d-e6f12518d85a"
//               width={40}
//               height={20}
//               alt="Profile_DP"
//               loader={imageLoader}
//             />
//             <div>
//               <div className=" font-sans h-5">Andrew Wilson</div>
//               <div className=" font-sans font-light text-xs">699 followers</div>
//             </div>
//           </div>
//           <div className="text-black flex items-center justify-center gap-2 bg-white px-5 py-1 rounded-full">
//             <FaStar />
//             <span className={`${raleway.className} text-lg font-bold`}>
//               4.7
//             </span>
//           </div>
//         </div>
//       </div>
//       {/* content end */}
//     </div>
//   );
// };
