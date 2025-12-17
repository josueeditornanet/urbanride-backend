# Implementação do Prisma ORM - Etapas Pendentes

## Requisitos para Continuar com a Implementação

Para continuar com a implementação completa do Prisma ORM, é necessário ter uma instância do PostgreSQL disponível. Atualmente, o Docker não está funcionando no sistema, então precisamos de uma alternativa.

## Opções para Continuar:

### Opção 1: Instalar PostgreSQL localmente
- Baixar e instalar PostgreSQL (versão 15 ou superior)
- Configurar um banco de dados chamado "urbanride_db"
- Configurar um usuário "urbanride" com senha
- Atualizar o DATABASE_URL no .env

### Opção 2: Usar serviço PostgreSQL em nuvem (gratuito)
- Criar conta no Supabase ou Heroku PostgreSQL
- Configurar um banco de dados gratuito
- Atualizar o DATABASE_URL no .env

## Próximas Etapas (após configuração do banco):

1. Executar as migrações para converter SERIAL IDs para UUIDs
2. Adicionar coluna JSONB para documentos no modelo User
3. Implementar as funções do Prisma nos controllers existentes
4. Manter as funções de segurança existentes (validação de saldo, proteção contra race conditions)

## Schema do Prisma Atual

O schema do Prisma já foi criado com base nos modelos definidos no blueprint e está localizado em `prisma/schema.prisma`. Ele inclui:
- Modelos com UUIDs como IDs
- Relacionamentos apropriados
- Enums para status e tipos
- Campos adicionais como `is_read` para mensagens

## Migrações Necessárias (para quando tivermos acesso ao banco):

1. Adicionar colunas temporárias UUID para todas as tabelas
2. Converter dados existentes
3. Atualizar chaves estrangeiras
4. Remover colunas antigas SERIAL (opcional)
5. Converter campos de documentos para JSONB

## Testes e Validação

Após implementar o Prisma:
- Validar todos os endpoints com o novo formato
- Testar a compatibilidade com o frontend
- Verificar a performance
- Garantir que as regras de negócio críticas (carteira pré-paga, race conditions) continuem funcionando