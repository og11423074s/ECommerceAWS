import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";
// @ts-ignore
import {ProductRepository} from "/opt/nodejs/productsLayer";
import {DynamoDB} from "aws-sdk";
import * as console from "console";

const productsDdb = process.env.PRODUCTS_DDB as string;
const ddbClient = new DynamoDB.DocumentClient();

const productRepository = new ProductRepository(ddbClient, productsDdb);

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const method = event.httpMethod

    let lambdaRequestId = context.awsRequestId;
    let apiRequestId = event.requestContext.requestId;

    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

    if (event.resource === "/products") {
        if (method === 'GET') {
            console.log('GET /products')

            const products = await productRepository.getAllProducts();

            return {
                statusCode: 200,
                body: JSON.stringify(products)
            }
        }
    } else if (event.resource === "/products/{id}") {
        const productId = event.pathParameters!.id as string;
        if (method === 'GET') {
            console.log(`GET /products/${productId}`)
            try {
                const product = await productRepository.getProductById(productId);
                return {
                    statusCode: 200,
                    body: JSON.stringify(product)
                }
            } catch (error) {
                console.log((<Error>error).message)
                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        message: (<Error>error).message
                    })
                }
            }
        }
    }

    return {
        statusCode: 400,
        body: JSON.stringify({
            message: "Bad Request"
        })
    }
}
