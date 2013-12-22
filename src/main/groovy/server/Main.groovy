package server
import static spark.Spark.*
import spark.Request
import spark.Response
import spark.Route
class Main {
  static void addPostRoute(route, closure) {
    post(new Route(route) {
        public Object handle(Request request, Response response) {
            return closure(request, response)
        }
    })
  }
  static main(args) {
    externalStaticFileLocation('src/main/web/')
    println 'running'
    addPostRoute('/info') {Request request, Response response ->
      println request.body()
      return 'OK'
    }
  }
}
