import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
// import PasswordController from '../controllers/PasswordController'; // Implementaremos depois

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// GET /passwords - Listar todas as senhas do usuário
router.get("/", async (req: Request, res: Response) => {
  try {
    // TODO: Implementar busca real no banco de dados
    // Por enquanto, retorna dados mockados
    const mockPasswords = [
      {
        id: 1,
        website: "ChemKey",
        username: "eu@gabrielcoelhosoares.com.br",
        password: "examplepassword",
        category: "other",
        strength: 3,
        favorite: false,
        dateAdded: new Date().toISOString(),
        notes: "Senha de exemplo",
      },
    ];

    res.json({
      success: true,
      passwords: mockPasswords,
    });
  } catch (error) {
    console.error("Erro ao buscar senhas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar senhas.",
    });
  }
});

// POST /passwords - Criar nova senha
router.post("/", async (req: Request, res: Response) => {
  try {
    const { website, username, password, category, notes } = req.body;

    // Validação básica
    if (!website || !username || !password) {
      return res.status(400).json({
        success: false,
        error: "Website, username e password são obrigatórios.",
      });
    }

    // TODO: Implementar salvamento real no banco de dados
    // Por enquanto, simula sucesso
    const newPassword = {
      id: Date.now(),
      website,
      username,
      password, // Em produção, isso seria criptografado
      category: category || "other",
      notes: notes || "",
      favorite: false,
      dateAdded: new Date().toISOString(),
      strength: calculatePasswordStrength(password),
      userId: req.session.user!.id,
    };

    res.status(201).json({
      success: true,
      message: "Senha salva com sucesso!",
      password: newPassword,
    });
  } catch (error) {
    console.error("Erro ao salvar senha:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao salvar senha.",
    });
  }
});

// PUT /passwords/:id - Atualizar senha
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { website, username, password, category, notes, favorite } = req.body;

    // TODO: Implementar atualização real no banco de dados
    res.json({
      success: true,
      message: "Senha atualizada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar senha.",
    });
  }
});

// DELETE /passwords/:id - Deletar senha
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implementar exclusão real no banco de dados
    res.json({
      success: true,
      message: "Senha deletada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao deletar senha:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar senha.",
    });
  }
});

// POST /passwords/generate - Gerar senha aleatória
router.post("/generate", (req: Request, res: Response) => {
  try {
    const {
      length = 12,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
    } = req.body;

    const generatedPassword = generatePassword({
      length: parseInt(length),
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
    });

    res.json({
      success: true,
      password: generatedPassword,
      strength: calculatePasswordStrength(generatedPassword),
    });
  } catch (error) {
    console.error("Erro ao gerar senha:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao gerar senha.",
    });
  }
});

// Função auxiliar para calcular força da senha
function calculatePasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 12) strength += 2;
  else if (password.length >= 8) strength += 1;

  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  return Math.min(5, strength);
}

// Função auxiliar para gerar senha
interface GeneratePasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

function generatePassword(options: GeneratePasswordOptions): string {
  let charset = "";

  if (options.includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
  if (options.includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.includeNumbers) charset += "0123456789";
  if (options.includeSymbols) charset += "!@#$%^&*()-_=+[]{}|;:,.<>?";

  if (charset === "") charset = "abcdefghijklmnopqrstuvwxyz";

  let password = "";
  for (let i = 0; i < options.length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

export default router;
