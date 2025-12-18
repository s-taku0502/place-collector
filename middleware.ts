import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicPage = createRouteMatcher(["/signin"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // ログイン済みでサインインページにアクセスした場合、/place にリダイレクト
  if (isPublicPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/place");
  }
  
  // 未ログインで公開ページ以外にアクセスした場合、/signin にリダイレクト
  if (!isPublicPage(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
