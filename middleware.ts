import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// デフォルトで公開するパス
const publicPaths = ["/signin", "/signin/reset"];

// 本番でも `/debug-auth` を見たい場合は環境変数で有効化する
// (例: ENABLE_DEBUG_AUTH=true)
if (process.env.ENABLE_DEBUG_AUTH === "true") {
  publicPaths.push("/debug-auth");
}

const isPublicPage = createRouteMatcher(publicPaths);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // 未ログインで公開ページ以外にアクセスした場合、/signin にリダイレクト
  if (!isPublicPage(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "(api|trpc)(.*)"],
};
