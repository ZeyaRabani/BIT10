use candid::{Nat, Principal};
use ic_cdk::api::call::call;
use ic_cdk::update;
use ic_llm::{tool, ChatMessage, Model, ParameterType};

const MODEL: Model = Model::Llama3_1_8B;

const BIT10_TOP_CANISTER: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x7d\x32\x01\x01"); // wbckh-zqaaa-aaaap-qpuza-cai
const BIT10_MEME_CANISTER: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x7d\x73\x01\x01"); // yeoei-eiaaa-aaaap-qpvzq-cai

#[derive(candid::CandidType, candid::Deserialize, Clone, Debug)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

async fn lookup_bit10_balance(token: &str, address: &str) -> String {
    let canister_principal = match token {
        "TOP" => BIT10_TOP_CANISTER,
        "MEME" => BIT10_MEME_CANISTER,
        _ => {
            ic_cdk::println!("Invalid token provided to lookup_bit10_balance: {}", token);
            return "Internal error: Unknown token type requested.".to_string();
        }
    };

    let principal = match Principal::from_text(address) {
        Ok(p) => p,
        Err(_) => {
            return format!("Invalid address format provided: {}. Please ensure it's a valid Principal ID.", address);
        }
    };

    let account = Account {
        owner: principal,
        subaccount: None,
    };

    let balance_result: Result<(Nat,), _> =
        call(canister_principal, "icrc1_balance_of", (account,)).await;
    let decimals_result: Result<(u8,), _> = call(canister_principal, "icrc1_decimals", ()).await;

    match (balance_result, decimals_result) {
        (Ok((balance,)), Ok((decimals,))) => {
            let balance_u128: u128 = match balance.0.to_u128() {
                Some(val) => val,
                None => {
                    return format!("Balance value is too large to process: {}", balance);
                }
            };

            let divisor = 10u128.pow(decimals as u32);
            if divisor == 0 {
                return "Error: Invalid token decimals detected.".to_string();
            }

            let float_balance = (balance_u128 as f64) / (divisor as f64);
            format!("Balance for your Test BIT10.{} is {:.8}", token, float_balance) // Format to 8 decimal places
        }
        (Err(e), _) => {
            ic_cdk::println!(
                "Failed to fetch balance for token {} and address {}: {:?}",
                token,
                address,
                e
            );
            format!(
                "Failed to fetch balance for Test BIT10.{}: Please try again later.",
                token
            )
        }
        (_, Err(e)) => {
            ic_cdk::println!(
                "Failed to fetch decimals for token {} and address {}: {:?}",
                token,
                address,
                e
            );
            format!(
                "Failed to fetch decimals for Test BIT10.{}: Please try again later.",
                token
            )
        }
    }
}

const SYSTEM_PROMPT: &str = r#"
You are an on-chain AI portfolio manager for BIT10. Answer questions directly and concisely without any meta-commentary.

Knowledge:
- What is BIT10?: BIT10 is an all in one asset manager.
- What index funds are offered by BIT10?: Test BIT10.TOP (tracks top 10 crypto excluding stablecoins), Test BIT10.MEME (tracks top 10 memecoins).
- What services does BIT10 offer?: BIT10 provides on-chain index funds, a cross-chain DEX, and a cross-chain lending/borrowing app. Users can borrow stablecoins against their BIT10 tokens.
- How does BIT10 work?: All canisters are on ICP. BIT10 tokens are backed by actual underlying tokens stored on their respective chains but controlled by ICP canisters. Tokens are rebalanced weekly.
- Is BIT10 secure?: Yes, BIT10 is secure. They have gone through auditing.
- How is BIT10 better compared to other investments?: BIT10 is rebalanced weekly, replacing underperforming tokens with better ones. Over 10 years, BIT10.TOP has outperformed BTC by ~3000%.

CRITICAL RULES:
1. Answer questions using ONLY the knowledge above.
2. For balance requests:
   - If user asks for specific token balance (e.g., "BIT10.TOP balance"), call lookup_bit10_balance with that token.
   - If user asks for "BIT10 balance", "total BIT10 balance", or "my BIT10 balance", call lookup_bit10_balance with "TOP" token (the system will handle checking both tokens if "total" or "all" is specified).
   - Users will provide their address using "My address is..." instead of "My principal is..."
3. NEVER include meta-commentary like "I can answer that directly", "You don't have to look up", etc.
4. NEVER mention balance information unless explicitly asked and tool is called.
5. NEVER make assumptions about user's portfolio or holdings.
6. Start responses immediately with the factual answer.
7. For unrelated questions: "I didn't get your question. Can you try again?"

Correct response format:
- Question: "What index fund is BIT10?"
- Answer: "BIT10 offers Test BIT10.TOP (tracks top 10 crypto excluding stablecoins) and Test BIT10.MEME (tracks top 10 memecoins)."

- Question: "What is my BIT10 balance? My address is xyz"
- Answer: [Call lookup_bit10_balance tool - system will check both tokens]
"#;

#[update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    let mut all_messages = vec![ChatMessage::System {
        content: SYSTEM_PROMPT.to_string(),
    }];
    all_messages.extend(messages.clone());

    let tools = vec![
        tool("lookup_bit10_balance")
            .with_description("Lookup the balance of Test BIT10.TOP (token: 'TOP') or Test BIT10.MEME (token: 'MEME') for an address. The address must be provided in the user's message.")
            .with_parameter(
                ic_llm::parameter("token", ParameterType::String)
                    .with_description("The token to look up: 'TOP' or 'MEME'.")
                    .is_required(),
            )
            .with_parameter(
                ic_llm::parameter("principal", ParameterType::String)
                    .with_description("The address to look up the balance for. This must be extracted from the user's message (e.g., 'my address is <address_id>').")
                    .is_required(),
            )
            .build(),
    ];

    let chat = ic_llm::chat(MODEL)
        .with_messages(all_messages.clone())
        .with_tools(tools);

    let response = chat.send().await;

    let user_message_content = messages.iter().rev().find_map(|msg| {
        if let ChatMessage::User { content } = msg {
            let trimmed_content = content.trim();
            if trimmed_content.is_empty() {
                None
            } else {
                Some(trimmed_content.to_lowercase())
            }
        } else {
            None
        }
    });

    let user_explicitly_wants_balance = if let Some(content) = &user_message_content {
        content.contains("balance")
            && (content.contains("bit10") || content.contains("top") || content.contains("meme"))
            && (content.contains("address") || content.contains("my"))
    } else {
        false
    };

    let wants_total_balance = if let Some(content) = &user_message_content {
        content.contains("balance")
            && (content.contains("total") || content.contains("bit10 balance") || content.contains("all"))
            && (content.contains("address") || content.contains("my"))
    } else {
        false
    };

    if let Some(ref content_str) = response.message.content {
        if !content_str.trim().is_empty() {
            return content_str.clone();
        }
    }

    if !response.message.tool_calls.is_empty() && user_explicitly_wants_balance {
        let first_tool_call_principal = response.message.tool_calls.first()
            .and_then(|call| call.function.get("principal"))
            .map(|s| s.to_string());
            
        let validated_principal = match first_tool_call_principal {
            Some(p) if Principal::from_text(&p).is_ok() => Some(p),
            _ => {
                return "I couldn't understand the address you provided. Please ensure it's a valid Principal ID.".to_string();
            }
        };

        if let Some(address) = validated_principal {
            if wants_total_balance {
                let top_balance = lookup_bit10_balance("TOP", &address).await;
                let meme_balance = lookup_bit10_balance("MEME", &address).await;

                return format!("{}\n{}", top_balance, meme_balance);
            } else {
                all_messages.push(ChatMessage::Assistant(response.message.clone()));
                let mut tool_results = Vec::new();
                for tool_call in &response.message.tool_calls {
                    let token = tool_call.function.get("token").unwrap_or_default();
                    if token != "TOP" && token != "MEME" {
                        ic_cdk::println!("LLM requested invalid token: {}", token);
                        tool_results.push(format!("Internal error: Invalid token type requested by AI for balance lookup."));
                        continue;
                    }

                    let current_call_address = tool_call.function.get("principal").unwrap_or_default();
                    if Principal::from_text(&current_call_address).is_err() {
                        tool_results.push(format!("Invalid address format found in tool call parameters."));
                        continue;
                    }
                    
                    let tool_result = match tool_call.function.name.as_str() {
                        "lookup_bit10_balance" => {
                            lookup_bit10_balance(&token, &current_call_address).await
                        }
                        _ => format!("Unknown tool: {}", tool_call.function.name),
                    };
                    tool_results.push(tool_result.clone());
                    all_messages.push(ChatMessage::Tool {
                        content: tool_result,
                        tool_call_id: tool_call.id.clone(),
                    });
                }
                return tool_results.last().unwrap_or(&"No result".to_string()).clone();
            }
        }
    }

    if !response.message.tool_calls.is_empty() && !user_explicitly_wants_balance {
        ic_cdk::println!("LLM attempted tool call without explicit user balance request or invalid principal. Retrying for text response.");
        all_messages.push(ChatMessage::Assistant(response.message.clone()));
        all_messages.push(ChatMessage::User {
            content: "Please provide a textual response to the user's original query without using any tools. Do not mention tools or that you are unable to use tools. Answer directly based on your knowledge.".to_string(),
        });

        let follow_up_chat = ic_llm::chat(MODEL).with_messages(all_messages);

        let follow_up_response = follow_up_chat.send().await;

        if let Some(ref content_str) = follow_up_response.message.content {
            if !content_str.trim().is_empty() {
                return content_str.clone();
            }
        }
    }

   "I didn't get your question. Can you try again?".to_string()
}
