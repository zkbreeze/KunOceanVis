//
//  main.cpp
//
//
//  Created by Kun Zhao on 2014-11-11 14:50:58.
//
//

#include <iostream>
#include <kvs/glut/Application>
#include <kvs/glut/Screen>
#include <kvs/StructuredVolumeObject>
#include <kvs/StructuredVolumeImporter>
#include <kvs/HydrogenVolumeData>
#include <kvs/CommandLine>
#include "RayCastingRenderer2D.h"
#include <kvs/TransferFunction>

int main( int argc, char** argv )
{
    kvs::glut::Application app( argc, argv );
    kvs::glut::Screen screen( &app );

    kvs::CommandLine param( argc, argv );
    param.addHelpOption();
    param.addOption( "1", "Input the first volume.", 1, true );
    param.addOption( "2", "Input the second volume.", 1, true );
    if ( !param.parse() ) return 1;    

    std::string filename1 = param.optionValue<std::string>( "1" );
    std::string filename2 = param.optionValue<std::string>( "2" );

    kvs::StructuredVolumeObject* volume_1 = new kvs::StructuredVolumeImporter( filename1 );
    kvs::StructuredVolumeObject* volume_2 = new kvs::StructuredVolumeImporter( filename2 );
    
    // set the 2d transfer function
    size_t tfunc_width = 64;
    kvs::TransferFunction tfunc( tfunc_width * tfunc_width );

//     size_t width = 64;
//     size_t height = 64;
//     float* tfunc2d = new float[width * height * 4];
//     for ( size_t j = 0; j < height; j++ )
//         for ( size_t i = 0; i < width; i++ )
//         {
//             int index = ( i + j * width ) * 4;
//             tfunc2d[index] = (float)i / width; // red
//             tfunc2d[index + 1] = (float)j / height; // green
//             tfunc2d[index + 2] = 1;              // blue
//             tfunc2d[index + 3] = (float) i * j / ( width * height ); //alpha
// //            *(tfunc2d++) = 0.01;
//         }
    
    kun::RayCastingRenderer2D* renderer = new kun::RayCastingRenderer2D();
    
    renderer->setSecondVolume( volume_2 );
    renderer->setTransferFunction( tfunc );
    renderer->disableShading();
    
    screen.registerObject( volume_1, renderer );
    screen.show();
    
    return( app.run() );   
}