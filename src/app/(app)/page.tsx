import type { Metadata } from "next";
import { auth } from "@/auth";
import { AccountMenu } from "@/components/AccountMenu";
import { SignedInHome } from "@/components/home/SignedInHome";
import { LandingPage } from "@/components/landing/LandingPage";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { loadAccountHome } from "@/lib/documents/list";
import { sampleSourceHref } from "@/lib/documents/sample-source";
import { loadAskedQuestions } from "@/lib/questions/history";

export const metadata: Metadata = {
  title: "DocTalk",
  description: "Ask a PDF a question and see the page the answer came from.",
};

export default async function HomePage() {
  const session = await auth();
  const viewerUserId = userIdFromTokenSub(session?.user?.id);

  if (viewerUserId) {
    const [library, questions] = await Promise.all([
      loadAccountHome(viewerUserId),
      loadAskedQuestions(viewerUserId),
    ]);

    return (
      <SignedInHome
        source={library.source}
        owned={library.owned}
        samples={library.samples}
        questions={questions}
        headerAccount={<AccountMenu variant="text" redirectTo="/" />}
      />
    );
  }

  const sourceHref = await sampleSourceHref();

  return (
    <LandingPage
      demoHref="/documents"
      sourceHref={sourceHref}
      headerAccount={<AccountMenu variant="text" redirectTo="/" />}
      heroAccount={<AccountMenu variant="google" redirectTo="/" />}
    />
  );
}
