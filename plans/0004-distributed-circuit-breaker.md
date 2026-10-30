# Circuit breaker distribuído reutilizável

## Contexto

O template usa Bun Redis mas não oferece proteção distribuída e configurável para integrações externas. Criar infraestrutura neutra de domínio; breaker controla disponibilidade e não prova que um pagamento falhou.

## Etapas

- [x] Implementar janela móvel, limiares, cooldown, uma sonda half-open cercada e classificação explícita por serviço/operação.
- [x] Usar chaves `serviceKey` com scripts Redis atômicos e falha fechada quando o armazenamento estiver indisponível.
- [x] Expor inspeção, eventos de transição e documentação sem retry automático de mutações.
- [ ] Concluir hooks e integração no branch main sem alterar WIP. Sete testes de integração passaram em Redis local isolado; o runner completo não iniciou porque a imagem Docker `redis:7-alpine` não está disponível.

Nenhuma infraestrutura remota ou publicação está autorizada.
