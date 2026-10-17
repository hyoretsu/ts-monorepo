import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { normalizeExampleName } from "@template/domain";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionGroup } from "@/components/ui/ActionGroup";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { type Example, type ExamplePage, exampleRequest } from "@/lib/api/example";
import { invalidateExamples, queryKeys } from "@/lib/query-cache";
import { showToast, useAuthStore } from "@/stores";
export function ExampleCard() {
	const user = useAuthStore(state => state.user);
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const listing = useInfiniteQuery({
		enabled: !!user,
		getNextPageParam: page => page.nextCursor,
		initialPageParam: null as string | null,
		queryFn: ({ pageParam }) =>
			exampleRequest<ExamplePage>(pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""),
		queryKey: queryKeys.examples(user?.id ?? "signed-out"),
		refetchInterval: query =>
			query.state.data?.pages.some(page => page.items.some(item => !item.processedAt)) ? 1000 : false,
	});
	const create = useMutation({
		mutationFn: (value: string) =>
			exampleRequest<Example>("", { body: JSON.stringify({ name: value }), method: "POST" }),
		onError: () => {
			setError(t("ui.failed"));
			showToast(t("ui.failed"), "negative");
		},
		onSuccess: () => {
			setName("");
			showToast(t("ui.saved"), "positive");
			if (user) void invalidateExamples(user.id);
		},
	});
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("ui.exampleTitle")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{!user ? (
					<p>{t("ui.signInRequired")}</p>
				) : (
					<>
						<form
							className="space-y-3"
							onSubmit={event => {
								event.preventDefault();
								try {
									const value = normalizeExampleName(
										String(new FormData(event.currentTarget).get("name") ?? ""),
									);
									setError("");
									create.mutate(value);
								} catch {
									setError(t("ui.required"));
								}
							}}
						>
							<TextField
								error={error}
								label={t("ui.exampleName")}
								name="name"
								onValueChange={setName}
								placeholder={t("ui.examplePlaceholder")}
								required
								value={name}
							/>
							<ActionGroup>
								<Button disabled={create.isPending} type="submit">
									{t("ui.create")}
								</Button>
							</ActionGroup>
						</form>
						{listing.isPending ? (
							<Skeleton className="h-24 w-full" />
						) : listing.isError && !listing.data ? (
							<p role="alert">{t("ui.failed")}</p>
						) : (
							<>
								<ul className="space-y-2">
									{listing.data?.pages
										.flatMap(page => page.items)
										.map(item => (
											<li className="flex justify-between gap-2 rounded border p-3" key={item.id}>
												<span>{item.name}</span>
												<span className="text-muted-foreground">
													{t(item.processedAt ? "ui.processed" : "ui.processing")}
												</span>
											</li>
										))}
								</ul>
								{listing.isFetchNextPageError && <p role="alert">{t("ui.failed")}</p>}
								{listing.hasNextPage && (
									<ActionGroup>
										<Button
											disabled={listing.isFetchingNextPage}
											onClick={() => void listing.fetchNextPage()}
											variant="outline"
										>
											{t("ui.loadMore")}
										</Button>
									</ActionGroup>
								)}
							</>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
