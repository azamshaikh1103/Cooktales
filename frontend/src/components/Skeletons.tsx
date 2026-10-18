export const SkeletonBlog = () => {
	return (
		<>
			<div className=" pt-16 lg:pt-28 mx-5 lg:mx-24 flex flex-col items-center">
				<div className=" w-[95%] lg:w-[55%] flex flex-col gap-2">
					<div className=" animate-custom-pulse w-full h-10 bg-slate-200 rounded-xl"></div>
					<div className=" animate-custom-pulse w-2/3 h-10 bg-slate-200 rounded-xl"></div>
					<div className=" animate-custom-pulse w-full h-6 bg-slate-200 rounded-xl"></div>
					<div className=" animate-custom-pulse w-2/3 h-6 bg-slate-200 rounded-xl"></div>
					<div className=" py-3 flex justify-between">
						<div className=" flex gap-3">
							<div className=" animate-custom-pulse w-10 h-10 rounded-full bg-slate-200 "></div>
							<div className=" animate-custom-pulse w-44 lg:w-52 h-10 rounded-xl bg-slate-200 "></div>
						</div>
						<div className=" animate-custom-pulse w-10 lg:w-36 h-10 rounded-xl bg-slate-200 "></div>
					</div>
					<div className=" animate-custom-pulse my-4 w-full h-52 bg-slate-200 rounded-3xl"></div>
					<div className=" animate-custom-pulse my-4 w-full h-52 bg-slate-200 rounded-3xl"></div>
				</div>
			</div>
		</>
	);
};
