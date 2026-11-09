"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
	type AffiliateSummary,
	adminAffiliateClient,
} from "@/lib/api/affiliateClient";
import { useAuth } from "@/lib/auth/AuthContext";

const RANGES = [7, 30, 90] as const;

const card =
	"rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]";

export default function AdminAffiliatePage() {
	const { user, status } = useAuth();
	const isAdmin = status === "authenticated" && user?.role === "ADMIN";
	const [days, setDays] = useState<number>(30);
	const [data, setData] = useState<AffiliateSummary | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isAdmin) return;
		let cancelled = false;
		setError(null);
		adminAffiliateClient
			.summary(days)
			.then((result) => {
				if (!cancelled) setData(result);
			})
			.catch((caught: unknown) => {
				if (!cancelled)
					setError(
						caught instanceof Error ? caught.message : "Could not load clicks",
					);
			});
		return () => {
			cancelled = true;
		};
	}, [isAdmin, days]);

	return (
		<div className="min-h-screen bg-[#fafafa] text-gray-900 dark:bg-[#0d1f1c] dark:text-white">
			<Navbar />
			<main className="mx-auto w-full max-w-5xl px-4 pt-28 pb-24 sm:px-6">
				<h1 className="text-2xl font-bold tracking-tight">Affiliate clicks</h1>
				<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Clicks on ingredient and equipment "Source" links, counted by CookTale
					itself. Ad blockers cannot hide these.
				</p>

				{status === "loading" ? (
					<p className="mt-6 text-sm text-gray-500">Loading…</p>
				) : !isAdmin ? (
					<p className="mt-6 text-sm text-gray-600 dark:text-gray-300">
						This page is for CookTale moderators.
					</p>
				) : (
					<>
						<div
							role="tablist"
							aria-label="Time range"
							className="mt-6 inline-flex rounded-full border border-gray-300 p-1 dark:border-white/15"
						>
							{RANGES.map((range) => (
								<button
									key={range}
									type="button"
									role="tab"
									aria-selected={days === range}
									onClick={() => setDays(range)}
									className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
										days === range
											? "bg-[#006c5e] text-white dark:bg-[#4ade80] dark:text-[#092019]"
											: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
									}`}
								>
									Last {range} days
								</button>
							))}
						</div>

						{error && (
							<p role="alert" className="mt-4 text-sm text-red-600">
								{error}
							</p>
						)}
						{!data && !error && (
							<p className="mt-6 text-sm text-gray-500">Loading…</p>
						)}

						{data && (
							<div className="mt-6 space-y-6">
								<div className={card}>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Total clicks
									</p>
									<p className="text-4xl font-bold">{data.total}</p>
								</div>

								<section className={card}>
									<h2 className="text-base font-bold">Top items</h2>
									{data.topItems.length === 0 ? (
										<p className="mt-3 text-sm text-gray-500">No clicks yet.</p>
									) : (
										<div className="mt-3 overflow-x-auto">
											<table className="w-full text-left text-sm">
												<thead className="text-xs text-gray-500 uppercase">
													<tr>
														<th className="py-2 pr-4">Item</th>
														<th className="py-2 pr-4">Recipe</th>
														<th className="py-2 pr-4">Creator</th>
														<th className="py-2 pr-4">Store</th>
														<th className="py-2 text-right">Clicks</th>
													</tr>
												</thead>
												<tbody>
													{data.topItems.map((row) => (
														<tr
															key={`${row.recipeId}-${row.itemKind}-${row.itemName}`}
															className="border-t border-gray-100 dark:border-white/10"
														>
															<td className="py-2 pr-4 font-semibold">
																{row.itemName}{" "}
																<span className="text-xs font-normal text-gray-500">
																	({row.itemKind})
																</span>
															</td>
															<td className="py-2 pr-4">
																<Link
																	href={`/recipe/${row.recipeSlug}`}
																	target="_blank"
																	className="hover:underline"
																>
																	{row.recipeName}
																</Link>
															</td>
															<td className="py-2 pr-4">{row.creatorName}</td>
															<td className="py-2 pr-4">{row.domain}</td>
															<td className="py-2 text-right font-bold">
																{row.clicks}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									)}
								</section>

								<div className="grid gap-6 sm:grid-cols-2">
									<section className={card}>
										<h2 className="text-base font-bold">Stores</h2>
										<ul className="mt-3 space-y-1.5 text-sm">
											{data.topDomains.map((row) => (
												<li key={row.domain} className="flex justify-between">
													<span>{row.domain}</span>
													<span className="font-bold">{row.clicks}</span>
												</li>
											))}
										</ul>
									</section>
									<section className={card}>
										<h2 className="text-base font-bold">Countries</h2>
										<ul className="mt-3 space-y-1.5 text-sm">
											{data.topCountries.map((row) => (
												<li
													key={row.country ?? "unknown"}
													className="flex justify-between"
												>
													<span>{row.country ?? "Unknown"}</span>
													<span className="font-bold">{row.clicks}</span>
												</li>
											))}
										</ul>
									</section>
								</div>

								<section className={card}>
									<h2 className="text-base font-bold">Latest clicks</h2>
									<div className="mt-3 overflow-x-auto">
										<table className="w-full text-left text-sm">
											<thead className="text-xs text-gray-500 uppercase">
												<tr>
													<th className="py-2 pr-4">When</th>
													<th className="py-2 pr-4">Who</th>
													<th className="py-2 pr-4">Item</th>
													<th className="py-2 pr-4">Recipe</th>
													<th className="py-2 pr-4">Store</th>
													<th className="py-2">From</th>
												</tr>
											</thead>
											<tbody>
												{data.recent.map((row) => (
													<tr
														key={row.id}
														className="border-t border-gray-100 dark:border-white/10"
													>
														<td className="py-2 pr-4 whitespace-nowrap">
															{new Date(row.createdAt).toLocaleString()}
														</td>
														<td className="py-2 pr-4">
															{row.visitor
																? row.visitor.username
																	? `@${row.visitor.username}`
																	: row.visitor.name
																: "Visitor (not signed in)"}
														</td>
														<td className="py-2 pr-4">{row.itemName}</td>
														<td className="py-2 pr-4">{row.recipeName}</td>
														<td className="py-2 pr-4">{row.domain}</td>
														<td className="py-2">{row.country ?? "—"}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</section>
							</div>
						)}
					</>
				)}
			</main>
			<Footer />
		</div>
	);
}
