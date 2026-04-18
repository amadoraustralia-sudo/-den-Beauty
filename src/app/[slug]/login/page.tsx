import { redirect } from "next/navigation";

export default async function SlugLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/login?redirect=/${slug}/inicio`);
}
