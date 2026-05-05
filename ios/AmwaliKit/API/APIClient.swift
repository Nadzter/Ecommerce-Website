import Foundation

public protocol APIClientProtocol: Sendable {
    func send<Request: Encodable, Response: Decodable>(
        _ method: HTTPMethod,
        path: String,
        body: Request?,
        headers: [String: String],
        decoding: Response.Type
    ) async throws -> Response
}

public enum HTTPMethod: String, Sendable {
    case get = "GET"
    case post = "POST"
    case patch = "PATCH"
    case delete = "DELETE"
}

public enum APIError: Error, Sendable {
    case http(status: Int, code: String?, message: String?)
    case transport(Error)
    case decoding(Error)
    case unauthenticated
}

public actor APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let log = AmwaliLogger(category: "api")

    public init(baseURL: URL = AmwaliConstants.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func send<Request: Encodable, Response: Decodable>(
        _ method: HTTPMethod,
        path: String,
        body: Request? = nil,
        headers: [String: String] = [:],
        decoding: Response.Type = Response.self
    ) async throws -> Response {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw APIError.http(status: 0, code: "invalid_url", message: nil)
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        for (k, v) in headers { request.setValue(v, forHTTPHeaderField: k) }

        if let token = try? KeychainStore.shared.get(.accessToken), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try JSONEncoder.amwali.encode(body)
        }

        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw APIError.http(status: 0, code: nil, message: nil)
            }
            if !(200..<300).contains(http.statusCode) {
                let envelope = try? JSONDecoder.amwali.decode(ErrorEnvelope.self, from: data)
                throw APIError.http(status: http.statusCode, code: envelope?.error.code, message: envelope?.error.message)
            }
            do {
                return try JSONDecoder.amwali.decode(Response.self, from: data)
            } catch {
                log.error("decode failure for \(path)")
                throw APIError.decoding(error)
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.transport(error)
        }
    }
}

public struct ErrorEnvelope: Decodable, Sendable {
    public struct Inner: Decodable, Sendable {
        public let code: String
        public let message: String
    }
    public let error: Inner
}

public extension JSONEncoder {
    static let amwali: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        e.keyEncodingStrategy = .convertToSnakeCase
        return e
    }()
}

public extension JSONDecoder {
    static let amwali: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }()
}
