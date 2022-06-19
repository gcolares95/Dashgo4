// Configuração do mirage/servidor do mirage
import { createServer, Factory, Model, Response } from 'miragejs';
import { faker } from '@faker-js/faker';

type User = {
    name: string;
    email: string;
    created_at: string;
};

export function makeServer() {
    const server = createServer({
        models: {                                  // quais dados queremos armazenar no "banco ficticio" que o mirage cria
            user: Model.extend<Partial<User>>({})  // user é como se fosse uma tabela no banco
        },                                         // <Partial<User> -> podemos usar user sem informar todos os campos necessariamente 

        factories: {                               // formas de gerar dados em "massa"
            user: Factory.extend({                 // precisa ser o mesmo nome do model, nesse caso "user"
                name(i: number) {
                    return `User ${i + 1}`
                },
                email() {
                    return faker.internet.email().toLowerCase();
                },
                createdAt() {                      // mesmo colocando em camelCase, mirage consegue identificarn que é created_at
                    return faker.date.recent(10)   // retorna data a partir de 10 dias da data atual
                }
            })
        },
        seeds(server) {                            // criar dados assim que o servidor do mirage for inicializado
            server.createList('user', 200)         // 'user' é o nome do factorie criado e 200 a quantidade de usuários
        },

        routes() {                                 // rotas que teremos no mirage
            this.namespace = 'api';                // setar o caminho que a aplicação vai precisar acessar para acessar as rotas do mirage 
            this.timing = 750;                     // Toda chamada a api do mirage demore 750 millisegundos para testar loading, etc

            this.get('/users', function (schema, request) {
                const { page = 1, per_page = 10 } = request.queryParams
                
                const total = schema.all('user').length; // obtendo o tamanho de usuários dentro do schema do mirage

                const pageStart = (Number(page) - 1) * Number(per_page);
                const pageEnd = pageStart + Number(per_page);

                const users = this.serialize(schema.all('user'))
                    .users.slice(pageStart, pageEnd);

                return new Response(
                    200,
                    { 'x-total-count': String(total) }, // passando headers
                    { users }
                )
            });  
                              
            this.post('/users');

            this.namespace = '';        
            this.passthrough();              
        }
    })

    return server;
}