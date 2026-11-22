# Barber Club 1987 — Relatório da Fase 6

**Período:** 21–22 de novembro de 2026 (UTC).  
**Status:** **NÃO APROVADO PARA PUBLICAÇÃO**.  
**Publicação:** não realizada; domínio não alterado; nenhum serviço externo contratado.

## A. O que foi auditado

- Página inicial: integração do catálogo, serviços, barbeiros, preços e rodapé; imagens e identidade visual preservadas.
- Agendamento: serviço, barbeiro, datas, horários, dados obrigatórios, revisão, confirmação e persistência real.
- Acesso administrativo: seis endereços administrativos, entrada inválida, cadastro público, permissões diretas e provisionamento de papéis.
- Código do painel: visão geral, busca/filtros/ordenação, detalhes, edição, status, reagendamento, agenda diária, serviços, equipe, funcionamento e bloqueios.
- Banco: tabelas, políticas, permissões, funções de disponibilidade/reserva/reagendamento, snapshots e prevenção de sobreposição.
- Segurança: varredura básica, análise aprofundada, linter e tentativas reais de acesso anônimo.
- Recuperação de acesso: solicitação, validação de e-mail, resposta sem revelar existência da conta e página de redefinição.
- Páginas públicas em 1280×1800, 890×674 e 390×844; fluxo completo de reserva em computador e celular.

**Limite importante:** o painel foi inspecionado no código, mas não operado com sessão administrativa. Não há usuários nem administradores; a criação da conta temporária foi recusada. Os testes de reservas usaram registros explicitamente identificados como auditoria, enviados ao sistema real, e não respostas simuladas. Esses registros foram removidos.

## B. Problemas encontrados

| Gravidade | Problema e impacto | Tratamento / estado |
|---|---|---|
| Alta, preventiva | A primeira conta recebia administração automaticamente. Com o cadastro fechado não foi demonstrada exploração, mas uma futura mudança de configuração poderia entregar o controle à primeira conta externa. | Função deixou de atribuir papéis; execução pública revogada. Administração exige atribuição explícita confiável. Não existe administrador provisionado. |
| Média | Configurações internas e horários individuais eram consultáveis diretamente por visitantes. | Horários individuais restritos a administradores; visitantes leem somente o limite público de dias. Reteste real bloqueou a leitura completa. |
| Média | Leitura direta incluía serviços e barbeiros inativos. | Políticas restringem visitantes ao catálogo ativo; administradores preservam acesso ao catálogo completo. Não foi desativado catálogo real para testar a mudança com login. |
| Alta | Preço digitado com ponto decimal, como `75.5`, era interpretado como R$ 755. | Parser corrigido; testes verificam R$ 75,50 e rejeitam formato inválido. |
| Média | Alterar o preço desmarcava automaticamente a condição demonstrativa. | Removida essa alteração automática; somente uma escolha explícita do administrador retira o aviso. Teste com login pendente. |
| Média | Salvamento dos sete dias e de perfil/serviços de barbeiro podia produzir alterações parciais. | Operações agora transacionais, com verificação de administrador no banco. Chamada anônima rejeitada; sucesso/rollback com administrador não testados. |
| Média | Lista e indicadores eram limitados silenciosamente a 1.000 agendamentos. | Leitura paginada com ordenação estável. Não houve teste de volume com mais de 1.000 registros reais. |
| Média | Intervalos podiam ficar fora do expediente por chamada direta; fuso e antecedência podiam contradizer regras do cliente. | Restrições adicionadas no banco para pausas dentro do expediente, fuso suportado e antecedência dentro do horizonte. Verificadas por leitura da definição; tentativas administrativas inválidas pendentes. |
| Média | Atualizações de reservas/bloqueios não invalidavam todas as consultas de disponibilidade relacionadas. | Invalidação ampliada para disponibilidade pública e opções de reagendamento. Teste administrativo entre telas pendente. |
| Média | Consulta de bloqueios omitia bloqueios antigos ao consultar uma agenda histórica. | Removido o corte da consulta compartilhada; a gestão de bloqueios continua mostrando somente futuros. Reteste histórico com administrador pendente. |
| Média | Tempo entre atendimentos podia aparecer como livre na grade diária. | Grade classifica o período após atendimento ativo como intervalo; dois testes de regra passaram. Conferência visual com administrador e buffer não zero pendente. |
| Baixa | Botões de repetir carregamento da equipe/agenda repetiam somente uma das consultas que poderiam falhar. | Repetição agora abrange todas as consultas da tela. Falha induzida com administrador não testada. |
| Baixa | Destino de login aceitava prefixos como `/administrator`. | Restrito a `/admin` e seus descendentes na mesma origem; testes passaram. |
| Média | Não havia recuperação de senha. | Fluxo preparado com autenticação existente; solicitação aceita e ausência de sessão bloqueada. Entrega e redefinição completa não verificadas. |
| Baixa | Faltavam títulos próprios nas páginas administrativas e índices de consulta por serviço/barbeiro. | Metadados próprios adicionados; dois índices criados sem alterar registros. |
| Alta — residual | Endpoint público permite reservas repetidas; validação e exclusão de conflitos não impedem abuso distribuído ou preenchimento da agenda com reservas falsas. | Limite próprio não implementado, conforme sua escolha. Risco de abuso permanece e impede aprovação comercial sem decisão futura. |
| Média — residual | Link do rodapé mostra `@barberclub1987`, mas leva ao Instagram genérico; a conta não foi confirmada. | Preservado para não contrariar a proibição de mudar textos/visual. Não considerar a rede social um dado comercial confirmado. Exige dado real e autorização para substituição. |

## C. Correções realizadas

### Banco e permissões

- `0002_audit_access_and_validation`: desativação da atribuição automática de administrador; revogação de execução; leitura restrita de horários/configurações; catálogo ativo para visitantes; validações de intervalos, fuso e antecedência.
- `0003_audit_atomic_admin_saves`: funções `save_business_hours` e `save_barber_profile`, transacionais, com verificação administrativa e execução reservada a contas autenticadas; telefone de 10 ou 11 dígitos no registro de agendamento.
- `0004_audit_lookup_indexes`: índices em agendamentos por serviço e bloqueios por barbeiro.
- Reservas, snapshots e mecanismo de exclusão de conflitos não foram reconstruídos.

### Código

- Corrigida interpretação de preços e preservação explícita do aviso demonstrativo.
- Atualizada leitura pública para selecionar somente o limite de dias permitido.
- Migração das gravações administrativas correspondentes para funções transacionais.
- Paginação estável dos agendamentos e rejeição de respostas inesperadamente vazias em operações que exigem dados.
- Atualização das consultas após alterações de reserva/bloqueio; repetição completa de carregamentos com erro.
- Validação de datas vazias em bloqueios; leitura histórica de bloqueios; buffer na grade.
- Destino de login restrito à área administrativa na mesma origem.
- Páginas `/recuperar-acesso` e `/redefinir-senha`, sem cadastro público novo, credenciais embutidas ou mensagens de entrega comprovada.
- Metadados únicos em todas as páginas de conteúdo; páginas administrativas não indexáveis.
- Testes permanentes de preço, destino administrativo, horários, senha e buffer.
- Não foram alterados textos, layout, cores, tipografia, animações ou fotos da página inicial.

## D. Testes executados

“Aprovado” abaixo significa que o teste descrito foi realmente executado; não estende aprovação a operações não testadas.

| Teste / tipo | Esperado | Obtido / evidência | Status |
|---|---|---|---|
| Testes automatizados existentes, antes de corrigir | Regras básicas continuam passando | 12 testes passaram na primeira execução | Aprovado |
| Testes automatizados finais | Regras básicas e regressões passam | 22 testes, 3 arquivos, zero falhas | Aprovado |
| Reserva real, computador | Concluir e mostrar dados corretos | Confirmação exibida; sem erro de execução nem rolagem lateral | Aprovado |
| Reserva real, celular | Concluir usando o mesmo sistema | Confirmação exibida em 390×844; sem erro de execução nem rolagem lateral | Aprovado |
| Campos obrigatórios, navegador | Bloquear avanço com nome/telefone vazios | Campo de nome marcado inválido; preenchimento válido permitiu continuar | Aprovado |
| Persistência e snapshots, leitura real | Dados da reserva ficam gravados | 4 reservas identificadas de auditoria; todas com Corte tradicional, R$ 75, 45 min e Rafael Mendes; duração gravada correta | Aprovado |
| Concorrência, API real | Apenas uma das cinco reservas conflitantes aceita | 1 aceita; 4 rejeitadas com SLOT_UNAVAILABLE | Aprovado |
| Disponibilidade depois da reserva | Horário ocupado deixa de aparecer | Consulta real excluiu o horário reservado | Aprovado |
| Manipulação pública de duração/exclusão | Visitante não reduz duração nem ignora reserva | Resultado idêntico ao cálculo normal | Aprovado |
| Telefone inválido, API real | Recusar entrada inválida | Reserva recusada | Aprovado |
| Limpeza após testes | Nenhum registro temporário restante | Contagem final: 0 agendamentos, 0 bloqueios, 0 administradores | Aprovado |
| Leitura anônima de clientes/reservas, bloqueios, papéis e horários individuais | Impedir acesso | Quatro consultas rejeitadas com HTTP 401 | Aprovado |
| Configurações internas | Impedir leitura completa; permitir horizonte público | Leitura completa: HTTP 401; limite público: HTTP 200 | Aprovado |
| Escrita anônima de preço | Não alterar registros | HTTP 200 com conjunto vazio após solicitar registros de retorno; nenhuma linha afetada | Aprovado |
| Provisionamento e funções administrativas por visitante | Recusar execução | Provisionamento: 404; gravações transacionais: 401 | Aprovado |
| Cadastro hospedado | Cadastro público fechado e confirmação não automática | Configuração real: disable_signup=true; mailer_autoconfirm=false; cadastro tentado rejeitado, HTTP 422 | Aprovado |
| Sessão inválida, API real | Recusar token inválido | HTTP 403 | Aprovado — não representa expiração de uma sessão válida |
| Acesso direto às seis páginas administrativas | Redirecionar visitante para entrada | Todas levaram a `/auth` | Aprovado |
| Login inválido, navegador | Exibir falha sem abrir painel | Mensagem de e-mail/senha incorretos | Aprovado |
| Solicitação de recuperação | Validar e-mail e não revelar se conta existe | Entrada vazia rejeitada; solicitação aceita para endereço não cadastrado, mensagem condicional | Aprovado — entrega não testada |
| Redefinição sem sessão | Não permitir trocar senha | Mensagem de link inválido/expirado | Aprovado |
| Páginas públicas, três tamanhos | Nenhuma rolagem horizontal | 15 combinações: início, agendar, entrada, recuperar e redefinir, em 3 tamanhos; zero overflow | Aprovado para essas páginas/estados |
| Varredura básica inicial | Identificar exposição | 6 apontamentos: 1 aviso e 5 informativos | Executado |
| Análise aprofundada inicial | Investigar código, dados e dependências | Sem novos achados no analisador de código; reiterou políticas públicas; relatório de dependências disponível sem achados | Executado — anterior às correções |
| Varredura básica após correções | Exposição interna removida | 1 informativo remanescente: funcionamento público usado no rodapé | Aprovado para o escopo desse scanner |
| Compilação automática | Nenhum erro atual | Últimas entradas do registro: build OK; erros transitórios introduzidos durante edição foram corrigidos | Aprovado |
| Login válido, logout e persistência de sessão | Funcionar com administrador | Sem conta; criação temporária recusada | Não testado |
| Expiração natural de sessão válida | Revalidar/encerrar acesso | Sem sessão real disponível | Não testado |
| Usuário autenticado sem papel | Não ler/alterar dados administrativos | Políticas inspecionadas, mas sem conta para operação real | Não testado |
| Dashboard, receita, indicadores e lista | Consistência entre páginas | Fórmulas inspecionadas: receita prevista soma pendentes/confirmados; concluídos separados nos status | Não testado com login |
| Busca nome/telefone; filtros data/barbeiro/serviço/status; ordenação | Resultados corretos | Código inspecionado; nenhum dado foi simulado no painel | Não testado com login |
| Detalhes, editar cliente, confirmar, cancelar, concluir, não compareceu | Gravar e atualizar telas com confirmação | Código, gatilho e invalidações inspecionados | Não testado com login |
| Reagendamento/liberação anterior/status inválidos | Banco recusa inconsistências | Função e gatilho inspecionados; não executados nesta fase com administrador | Não testado com login |
| Editar/preço/duração/ativar/desativar serviço | Persistir e refletir no site/agendamento | Política, validações e consultas inspecionadas | Não testado com login |
| Perfil/ativação/serviços/horários/folgas de barbeiro | Persistir e alterar disponibilidade | Função transacional e políticas inspecionadas | Não testado com login |
| Funcionamento/pausas/antecedência/horizonte/intervalo | Persistir e aplicar regras | Restrições e cálculo inspecionados | Não testado com login |
| Pausa, folga, bloqueio, serviço/barbeiro desativado, limite de fechamento/antecedência/horizonte | Recusar reservas inválidas em cada caso | Cálculo no banco inspecionado; não alteradas configurações reais para criar esses cenários | Não testado individualmente nesta fase |
| Painel em desktop/tablet/celular | Sem cortes, sobreposição ou defeitos | Somente bloqueio sem login conferido | Não testado autenticado |
| Recuperação por e-mail até trocar senha | Link chega, é usado e senha funciona | Sem destinatário real/conta para verificar | Não testado |
| Notificação de nova reserva | Administrador recebe aviso | Não existe envio implementado; não contratado serviço externo | Não testado / pendente |

**Notas de execução:** a primeira captura do calendário foi feita durante carregamento; aguardar o estado final mostrou datas disponíveis. A primeira espera de confirmação usou um título incorreto no roteiro de teste; corrigido o seletor, as duas reservas completas foram verificadas. Esses erros do roteiro não foram contabilizados como falhas do aplicativo. Um teste de escrita recebeu inicialmente HTTP 204; o reteste com retorno de registros demonstrou conjunto vazio, sem linha alterada. Não se considerou HTTP 2xx, sozinho, evidência de permissão de escrita.

## E. Pendências do proprietário

1. **Criar a conta administrativa em More → Users → Add user.** A primeira conta não vira administradora automaticamente. Depois de criada, informar qual conta deve receber o papel; a atribuição será feita por uma operação confiável específica e verificável, nunca por cadastro público ou alteração de dados pelo navegador. Não enviar sua senha na conversa.
2. **Disponibilizar uma sessão para os testes do painel**, entrando no preview ou autorizando uma conta temporária de auditoria. As verificações administrativas essenciais permanecem abertas.
3. **Substituir os dados comerciais demonstrativos:** preços, endereço e funcionamento; confirmar o perfil real do Instagram e autorizar a substituição do link/texto não confirmado. O catálogo continuará com quatro serviços e três barbeiros, como você confirmou.
4. **Para recuperação completa**, verificar os endereços permitidos em More → Users → Auth settings → Advanced e testar o recebimento em sua própria conta. O endereço de retorno deve incluir `/redefinir-senha` na origem usada. O remetente padrão da autenticação pode atender sem domínio próprio, mas entrega não foi comprovada aqui.
5. **Para notificações de reservas**, escolher o endereço destinatário e, se quiser envio próprio, fornecer um domínio de e-mail já verificado. Não foi inventado remetente, contratado provedor nem assumido domínio disponível. Nenhum domínio personalizado do projeto estava configurado na consulta realizada.
6. **Resolver a decisão de proteção contra abuso antes de abrir comercialmente.** Sua escolha atual foi documentar e não implementar limite próprio; essa decisão foi respeitada, mas o risco permanece.

## F. Segurança

### Efetivamente verificado

- Cadastro público desabilitado na configuração hospedada, não apenas na interface.
- Nenhuma promoção automática na criação de conta; visitantes não executam a função antiga de provisionamento.
- Visitantes não leem registros de agendamento, nomes/telefones/e-mails/notas/histórico/códigos de outros clientes pelas tabelas privadas.
- Horários individuais e configurações internas não são diretamente públicos; o horizonte de dias é público por necessidade do calendário.
- Funções de gravação administrativa novas rejeitam visitantes; operações administrativas existentes usam políticas que exigem `is_admin()`.
- Reserva é validada no banco e cinco pedidos conflitantes produziram exatamente uma gravação.
- Duração e exclusão administrativa não podem ser manipuladas por visitante na disponibilidade.
- Snapshots corretos nas reservas gravadas; as reservas de auditoria foram removidas sem apagar clientes reais.
- Não foram criadas nem mostradas senhas reais, tokens ou chaves privadas; o cliente usa chave publicável. Não há função pública de consulta de reserva por código na implementação inspecionada.

### Riscos e limites remanescentes

- **Abuso de reservas públicas: risco alto operacional, não tratado por sua escolha.** Validação, bloqueio de sobreposição e proteção de formulário não equivalem a limite de requisições ou proteção completa contra bots.
- **Contas autenticadas sem papel:** políticas indicam bloqueio, mas falta reteste real com conta sem privilégios.
- **Administrador:** inexistente; impede validar login válido, operações, logout, persistência e expiração natural.
- **Recuperação:** aceitação da solicitação não prova entrega; fluxo completo ainda não testado.
- **Linter:** funções de reserva/disponibilidade continuam deliberadamente públicas e com privilégios controlados para consultar ocupação sem expor clientes. Funções administrativas e helpers de papel são deliberadamente executáveis por autenticados, com verificações. Esses avisos não são, por si só, demonstração de exploração.
- A extensão `btree_gist` permanece em `public`, com aviso do linter. Não foi movida nesta fase porque participa do mecanismo de exclusão de conflitos; uma mudança precisa investigar dependências e regressões. É uma pendência de endurecimento, não um vazamento de clientes demonstrado.
- Dois índices apontados pelo linter foram acrescentados. A análise aprofundada executada analisou o estado anterior às correções; não foi feita segunda análise aprofundada do código final.
- Uma varredura sem achados altos não substitui os testes administrativos pendentes nem elimina o risco antiabuso identificado manualmente.

## G. Status de publicação

### NÃO APROVADO PARA PUBLICAÇÃO

Motivos verificáveis:

1. Login válido e todas as operações administrativas essenciais não foram executados com autenticação.
2. Não existe administrador provisionado.
3. Proteção contra abuso público permanece pendente, com risco operacional alto.
4. Dados comerciais ainda demonstrativos e perfil social não confirmado.
5. Recuperação completa por e-mail e notificações não verificadas.

As reservas públicas, persistência, concorrência, bloqueios anônimos e páginas públicas testadas funcionaram. Isso permite continuar a preparação, mas não aprovar publicação comercial. O site não foi publicado.