use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[clap(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Build a sheet
    #[clap(arg_required_else_help = true)]
    Build { path: std::path::PathBuf },
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Build { path } => {
            let content = std::fs::read_to_string(&path).expect("Failed to read the file");

            for line in content.lines() {
                println!("{}", line);
            }
        }
    }
}
