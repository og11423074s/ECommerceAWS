import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuid } from 'uuid';


// Purpose: Model for Product.
export interface Product {
    id: string;
    productName: string;
    code: string;
    price: number;
    model: string;
}

export class ProductRepository {
    private ddbClient: DocumentClient;
    private productsDdb: string;

    constructor(ddbClient: DocumentClient, productsDdb: string) {
        this.ddbClient = ddbClient;
        this.productsDdb = productsDdb;
    }

    // Purpose: Get all products.
    async getAllProducts(): Promise<Product[]> {
        const params = {
            TableName: this.productsDdb
        }
        const data = await this.ddbClient.scan(params).promise();
        return data.Items as Product[];
    }

    // Purpose: Get product by id.
    async getProductById(productId: string): Promise<Product | undefined> {
        const params = {
            TableName: this.productsDdb,
            Key: {
                id: productId
            }
        }
        const data = await this.ddbClient.get(params).promise();

        if (data.Item) {
            return data.Item as Product;
        } else {
            throw new Error("Product not found");
        }

    }

    // Purpose: Create a product.
    async create(product: Product): Promise<Product> {
        product.id = uuid();
        const params = {
            TableName: this.productsDdb,
            Item: product
        }
        await this.ddbClient.put(params).promise();
        return product;
    }

    // Purpose: Delete a product.
    async delete(productId: string): Promise<Product> {

        const params = {
            TableName: this.productsDdb,
            Key: {
                id: productId
            },
            ReturnValues: "ALL_OLD"
        }
        const data = await this.ddbClient.delete(params).promise();

        if (data.Attributes) {
            return data.Attributes as Product;
        } else {
            throw new Error("Product not found");
        }
    }

    // Purpose: Update a product.
    async updateProduct(productId: string, product: Product): Promise<Product> {
        const params = {
            TableName: this.productsDdb,
            Key: {
                id: productId
            },
            ConditionExpression: "attribute_exists(id)",
            ReturnValues: "UPDATED_NEW",
            UpdateExpression: "set productName = :productName, code = :code, price = :price, model = :model",
            ExpressionAttributeValues: {
                ":productName": product.productName,
                ":code": product.code,
                ":price": product.price,
                ":model": product.model
            },

        }
        const data = await this.ddbClient.update(params).promise();

        data.Attributes!.id = productId;
        return data.Attributes as Product;

    }
}
