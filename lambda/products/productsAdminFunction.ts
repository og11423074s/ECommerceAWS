import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";
// @ts-ignore
import {ProductRepository} from "/opt/nodejs/productsLayer";
import {DynamoDB} from "aws-sdk";
import * as console from "console";
import {Product} from "./layers/productsLayer/nodejs/productRepository";

const productsDdb = process.env.PRODUCTS_DDB as string;
const ddbClient = new DynamoDB.DocumentClient();

const productRepository = new ProductRepository(ddbClient, productsDdb);
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const method = event.httpMethod

    let lambdaRequestId = context.awsRequestId;
    let apiRequestId = event.requestContext.requestId;

    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

    if(event.resource === "/products") {
        console.log('POST /products')
        const product = JSON.parse(event.body!) as Product;

        if(method === 'POST') {
            const productCreated = await productRepository.create(product);

            return {
                statusCode: 201,
                body: JSON.stringify(productCreated)
            }
        }
    } else if (event.resource === "/products/{id}") {
        const productId = event.pathParameters!.id as string;
        if(method === 'PUT') {
            console.log(`PUT /products/${productId}`)
            const product = JSON.parse(event.body!) as Product;

            try {
                const productUpdated = await productRepository.updateProduct(productId, product);
                return {
                    statusCode: 200,
                    body: JSON.stringify(productUpdated)
                }
            } catch (ConditionCheckFailedException) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        message: "Product not found"
                    })
                }
            }

        } else if(method === 'DELETE') {
            console.log(`DELETE /products/${productId}`)
            try {
                const product = await productRepository.delete(productId);
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
